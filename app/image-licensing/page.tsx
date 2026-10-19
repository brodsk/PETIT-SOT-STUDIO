import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image Licensing & Copyright",
  description:
    "Copyright and image licensing information for original artwork and photographs published by Olga Trikhleb and PETITSOT Studio.",
  alternates: { canonical: "https://www.petitsot.com/image-licensing" },
  robots: { index: true, follow: true },
};

export default function ImageLicensingPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 text-neutral-900">
      <p className="mb-3 text-xs uppercase tracking-[0.2em] text-neutral-500">PETITSOT STUDIO</p>
      <h1 className="mb-4 text-4xl tracking-tight">Image Licensing & Copyright</h1>
      <p className="mb-10 text-sm text-neutral-500">Last updated: 19 October 2026</p>

      <div className="space-y-8 leading-7">
        <section>
          <h2 className="mb-2 text-xl">Copyright ownership</h2>
          <p>Unless a specific credit states otherwise, the artwork images, photographs and related visual material published on petitsot.com are protected by copyright and are credited to artist Olga Trikhleb and PETITSOT Studio as applicable. All rights remain with their respective copyright holders.</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl">Permitted use</h2>
          <p>Viewing the images on this website does not grant permission to reproduce, redistribute, modify, publish, sell, use for commercial purposes, or include them in datasets or products. Written permission from the relevant rights holder is required before reuse, except where applicable law expressly permits it.</p>
        </section>
        <section>
          <h2 className="mb-2 text-xl">Request permission to use an image</h2>
          <p>If you would like to license, reproduce, publish or otherwise use an artwork image, please contact us before using it. Include the artwork title, the image or page URL, your intended use, where it will appear, and the expected duration of use.</p>
          <p className="mt-2">Email: <a className="underline underline-offset-4" href="mailto:manager@petitsot.com">manager@petitsot.com</a></p>
        </section>
        <section>
          <h2 className="mb-2 text-xl">Image credits</h2>
          <p>Suggested credit where applicable: “Artwork by Olga Trikhleb / PETITSOT Studio”. A credit alone does not replace permission when permission is required.</p>
        </section>
      </div>
    </main>
  );
}
