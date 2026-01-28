/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import React from 'react';
import { Plus, Edit3, Globe, Instagram, Facebook, Linkedin } from 'lucide-react';
import type { Brand, ScrapedContent } from '../../hooks/useBrandAPI';

interface BrandSelectorProps {
  brands: Brand[];
  selectedBrandId: string | null;
  onSelectBrand: (brandId: string) => void;
  onCreateBrand: () => void;
  onEditBrand: (brand: Brand) => void;
  scrapedContent?: Map<string, ScrapedContent[]>;
  isLoading?: boolean;
}

// Platform icon colors when URL is configured
const PLATFORM_COLORS = {
  website: '#3B82F6', // blue
  instagram: '#E4405F', // instagram pink
  facebook: '#1877F2', // facebook blue
  linkedin: '#0A66C2', // linkedin blue
};

function PlatformIcon({
  platform,
  hasUrl,
  hasContent,
}: {
  platform: 'website' | 'instagram' | 'facebook' | 'linkedin';
  hasUrl: boolean;
  hasContent: boolean;
}) {
  const Icon =
    platform === 'website'
      ? Globe
      : platform === 'instagram'
        ? Instagram
        : platform === 'facebook'
          ? Facebook
          : Linkedin;

  const color = hasUrl ? PLATFORM_COLORS[platform] : 'rgba(255, 255, 255, 0.3)';
  const opacity = hasContent ? 1 : hasUrl ? 0.6 : 0.3;

  return (
    <div
      style={{ opacity }}
      title={
        hasContent
          ? `${platform}: Scraped`
          : hasUrl
            ? `${platform}: Configured`
            : `${platform}: Not configured`
      }
    >
      <Icon style={{ width: 14, height: 14, color }} />
    </div>
  );
}

export function BrandSelector({
  brands,
  selectedBrandId,
  onSelectBrand,
  onCreateBrand,
  onEditBrand,
  scrapedContent,
  isLoading,
}: BrandSelectorProps) {
  const getBrandContentStatus = (brandId: string) => {
    const content = scrapedContent?.get(brandId) || [];
    return {
      hasWebsite: content.some((c) => c.platform === 'website'),
      hasInstagram: content.some((c) => c.platform === 'instagram'),
      hasFacebook: content.some((c) => c.platform === 'facebook'),
      hasLinkedin: content.some((c) => c.platform === 'linkedin'),
    };
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginTop: '16px',
        marginBottom: '8px',
      }}
    >
      {/* Label */}
      <div
        style={{
          fontSize: '12px',
          fontWeight: 500,
          color: 'rgba(255, 255, 255, 0.6)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Select Brand
      </div>

      {/* Horizontal scrollable container */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '8px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        className="scrollbar-hidden"
      >
        {/* Existing brands */}
        {brands.map((brand) => {
          const isSelected = selectedBrandId === brand.id;
          const contentStatus = getBrandContentStatus(brand.id);

          return (
            <div
              key={brand.id}
              onClick={() => onSelectBrand(brand.id)}
              style={{
                position: 'relative',
                flexShrink: 0,
                width: '180px',
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: 'rgb(38, 40, 42)',
                cursor: 'pointer',
                transition: 'all 200ms',
                border: isSelected ? '2px solid transparent' : '2px solid rgba(255, 255, 255, 0.1)',
                backgroundImage: isSelected
                  ? 'linear-gradient(rgb(38, 40, 42), rgb(38, 40, 42)), linear-gradient(90deg, #FF6B6B, #FFE66D, #FF6B6B)'
                  : undefined,
                backgroundOrigin: 'border-box',
                backgroundClip: isSelected ? 'padding-box, border-box' : undefined,
                animation: isSelected ? 'borderGlow 2s linear infinite' : undefined,
              }}
            >
              {/* Edit button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditBrand(brand);
                }}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  padding: '4px',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(255, 255, 255, 0.5)',
                  transition: 'all 150ms',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
                }}
                aria-label="Edit brand"
              >
                <Edit3 style={{ width: 14, height: 14 }} />
              </button>

              {/* Brand name */}
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'white',
                  marginBottom: '12px',
                  paddingRight: '24px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {brand.name}
              </div>

              {/* Platform icons */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <PlatformIcon
                  platform="website"
                  hasUrl={!!brand.website_url}
                  hasContent={contentStatus.hasWebsite}
                />
                <PlatformIcon
                  platform="instagram"
                  hasUrl={!!brand.instagram_url}
                  hasContent={contentStatus.hasInstagram}
                />
                <PlatformIcon
                  platform="facebook"
                  hasUrl={!!brand.facebook_url}
                  hasContent={contentStatus.hasFacebook}
                />
                <PlatformIcon
                  platform="linkedin"
                  hasUrl={!!brand.linkedin_url}
                  hasContent={contentStatus.hasLinkedin}
                />
              </div>

              {/* Language badge */}
              <div
                style={{
                  marginTop: '10px',
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  textTransform: 'uppercase',
                }}
              >
                {brand.language === 'both' ? 'NL/EN' : brand.language.toUpperCase()}
              </div>
            </div>
          );
        })}

        {/* Add Brand button */}
        <button
          onClick={onCreateBrand}
          disabled={isLoading}
          style={{
            flexShrink: 0,
            width: '180px',
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: 'rgb(38, 40, 42)',
            border: '2px dashed rgba(255, 255, 255, 0.2)',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 200ms',
            opacity: isLoading ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
              e.currentTarget.style.backgroundColor = 'rgb(45, 47, 49)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.backgroundColor = 'rgb(38, 40, 42)';
          }}
        >
          <Plus style={{ width: 24, height: 24, color: 'rgba(255, 255, 255, 0.5)' }} />
          <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 500 }}>
            Add Brand
          </span>
        </button>
      </div>

      {/* Animated border keyframes */}
      <style>{`
        @keyframes borderGlow {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  );
}
