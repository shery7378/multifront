//src/components/ServiceCard.jsx
import Image from "next/image";

export default function ServiceCard({ image, title, link, linkName=null }) {
  return (
    <article className="flex flex-col items-start text-left hover:scale-[1.05] transition-transform duration-300 ease-in-out">
      <Image
        src={image}
        alt={title}
        width={300}
        height={200}
        className="mb-3 rounded-md object-contain"
        priority={false} // true if important, false to lazy-load
      />
      <h3 className="text-[25px]/[36px] font-bold text-gray-900 mb-1">{title}</h3>
      <a
        href={link}
        className="text-black underline font-medium"
        aria-label={`View details about ${title}`}
      >
        Add your restaurant
      </a>
    </article>
  );
}

