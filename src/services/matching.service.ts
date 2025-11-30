import { prisma } from '../utils/db';
import { VendorMatch } from '../types';
import { config } from '../config';

export class MatchingService {
  async findMatches(lead: any): Promise<VendorMatch[]> {
    const vendors = await prisma.vendor.findMany({
      where: {
        categories: { has: lead.category },
        subcategories: { has: lead.subcategory },
        serviceAreas: { has: lead.address.pincode },
        isActive: true,
      }
    });

    const matches: VendorMatch[] = vendors.map(vendor => {
      const score = this.calculateScore(vendor, lead);
      
      // Safely handle vendor.location
      const vendorLoc = vendor.location as any;
      const distance = vendorLoc?.coordinates 
        ? this.calculateDistance(lead.address.coordinates, vendorLoc.coordinates)
        : 999999;

      return {
        vendorId: vendor.id,
        businessName: vendor.businessName,
        rating: vendor.rating,
        distance,
        priceRange: vendor.priceRange,
        score,
      };
    });

    // Sort by score and return top matches
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, config.business.maxVendorMatches);
  }

  private calculateScore(vendor: any, lead: any): number {
    // Distance score (0-100)
    const vendorLoc = vendor.location as any;
    const distance = vendorLoc?.coordinates
      ? this.calculateDistance(lead.address.coordinates, vendorLoc.coordinates)
      : 999999;
    const proximityScore = Math.max(0, 100 - (distance * 10)); // 10km = 0 score

    // Rating score (0-100)
    const ratingScore = (vendor.rating / 5) * 100;

    // Acceptance rate score (0-100)
    const acceptScore = vendor.acceptanceRate * 100;

    // Price fit score (simplified)
    const priceScore = 70; // Default medium fit

    // Weighted average
    return (
      proximityScore * 0.35 +
      ratingScore * 0.25 +
      priceScore * 0.20 +
      acceptScore * 0.20
    );
  }

  private calculateDistance(coord1: any, coord2: any): number {
    // Haversine formula (simplified)
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(coord2.lat - coord1.lat);
    const dLon = this.toRad(coord2.lng - coord1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(coord1.lat)) *
      Math.cos(this.toRad(coord2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
