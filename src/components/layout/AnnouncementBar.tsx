import { announcementText } from "@/lib/site";

export function AnnouncementBar() {
  return (
    <div className="relative z-40 bg-navy text-cream">
      <div className="container-x flex h-9 items-center justify-center gap-3 text-center">
        <span aria-hidden="true" className="hidden h-1 w-1 rounded-full bg-brown-200 sm:block" />
        <p className="text-[10.5px] font-bold uppercase tracking-editorial sm:text-[11px]">
          {announcementText}
        </p>
        <span aria-hidden="true" className="hidden h-1 w-1 rounded-full bg-brown-200 sm:block" />
      </div>
    </div>
  );
}
