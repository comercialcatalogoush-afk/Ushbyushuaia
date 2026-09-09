import type { ElementType } from 'react';
import { ContentValues, sectionStyleFromContent } from '@/lib/siteContent';
import { Instagram, Facebook, MessageCircle, Star } from 'lucide-react';

const TikTokIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.22 8.22 0 0 0 4.83 1.56V6.81a4.85 4.85 0 0 1-1.07-.12z"/>
  </svg>
);

function Stars({ value }: { value?: string }) {
  const n = Math.min(5, Math.max(0, Number(value) || 5));
  return (
    <div className="flex gap-0.5 text-amber-400" aria-label={`${n} de 5 estrellas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={14} className={i < n ? 'fill-current' : 'opacity-25'} />
      ))}
    </div>
  );
}

export function SocialReviewsSection({ content }: { content: ContentValues }) {
  const style = sectionStyleFromContent('home-social', content);
  const socials: { url?: string; label: string; handle?: string; Icon: ElementType }[] = [
    { url: content.instagramUrl, label: 'Instagram', handle: content.instagramHandle, Icon: Instagram },
    { url: content.facebookUrl, label: 'Facebook', handle: content.facebookHandle, Icon: Facebook },
    { url: content.tiktokUrl, label: 'TikTok', handle: content.tiktokHandle, Icon: TikTokIcon },
    { url: content.whatsappUrl, label: 'WhatsApp', handle: content.whatsappHandle, Icon: MessageCircle },
  ];
  const reviews = [
    { name: content.review1Name, city: content.review1City, stars: content.review1Stars, text: content.review1Text },
    { name: content.review2Name, city: content.review2City, stars: content.review2Stars, text: content.review2Text },
    { name: content.review3Name, city: content.review3City, stars: content.review3Stars, text: content.review3Text },
  ];

  return (
    <section data-editor-section="home-social" style={style} className="reveal bg-white border-t border-gray-100 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Redes sociales */}
        <div className="text-center space-y-3">
          <p data-field-key="socialEyebrow" className="text-[10px] font-bold uppercase tracking-[0.3em] text-ush-pink">{content.socialEyebrow}</p>
          <h2 data-field-key="socialTitle" className="text-2xl sm:text-3xl font-black uppercase text-ush-navy">{content.socialTitle}</h2>
          <p data-field-key="socialSub" className="text-xs text-neutral-500 font-light max-w-xl mx-auto leading-relaxed">{content.socialSub}</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {socials.map(({ url, label, handle, Icon }) => (
            <a key={label} href={url || '#'} target={url ? '_blank' : undefined} rel="noopener noreferrer"
              className="group flex flex-col items-center gap-2 bg-neutral-50 border border-gray-200 rounded-2xl p-5 hover:border-ush-pink hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-full bg-white border border-gray-200 text-ush-pink group-hover:bg-ush-pink group-hover:text-white flex items-center justify-center transition-colors">
                <Icon size={22} />
              </div>
              <p className="text-xs font-black uppercase tracking-wide text-neutral-900">{label}</p>
              <p className="text-[11px] text-neutral-500 truncate max-w-full">{handle}</p>
            </a>
          ))}
        </div>

        {/* Reseñas positivas */}
        <div className="text-center space-y-3 pt-4">
          <p data-field-key="reviewsEyebrow" className="text-[10px] font-bold uppercase tracking-[0.3em] text-ush-pink">{content.reviewsEyebrow}</p>
          <h2 data-field-key="reviewsTitle" className="text-2xl sm:text-3xl font-black uppercase text-ush-navy">{content.reviewsTitle}</h2>
          <p data-field-key="reviewsSub" className="text-xs text-neutral-500 font-light max-w-xl mx-auto leading-relaxed">{content.reviewsSub}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reviews.map((r, i) => (
            <figure key={i} className="bg-neutral-50 border border-gray-200 rounded-2xl p-5 flex flex-col gap-3">
              <Stars value={r.stars} />
              <blockquote data-field-key={`review${i + 1}Text`} className="text-xs text-neutral-600 leading-relaxed">{r.text}</blockquote>
              <figcaption className="mt-auto flex items-center gap-2 pt-2 border-t border-gray-200">
                <div className="w-8 h-8 rounded-full bg-ush-pink text-white flex items-center justify-center text-[11px] font-black">
                  {(r.name || 'C').charAt(0)}
                </div>
                <div>
                  <p data-field-key={`review${i + 1}Name`} className="text-[11px] font-black uppercase text-neutral-900">{r.name}</p>
                  <p data-field-key={`review${i + 1}City`} className="text-[10px] text-neutral-500">{r.city}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}