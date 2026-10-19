import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image Licensing & Copyright",
  description: "Copyright and image licensing information for artwork and photographs published by Olga Trikhleb and PETITSOT Studio.",
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
          <h2 className="mb-2 text-xl">Copyright</h2>
          <p>
            Paintings presented on petitsot.com are attributed to artist Olga Trikhleb unless stated otherwise.
            Artwork, photographs and website text may be protected by copyright and may have different rights
            holders. PETITSOT Studio does not claim ownership of third-party material.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">Buying an original painting</h2>
          <p>
            Buying a physical painting does not, by itself, transfer copyright or grant permission to reproduce,
            publish or commercially use its image. Any separate licence or transfer of rights must be agreed
            with the relevant rights holder.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">Using and sharing images</h2>
          <p>
            You may link to a public page on this website. Re-uploading, reproducing or commercially using an
            artwork image generally requires permission unless applicable law says otherwise. This notice does
            not limit any exceptions or rights provided by law.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">Permission and copyright concerns</h2>
          <p>
            For licensing requests or to report a suspected infringement or incorrect credit, email{" "}
            <a className="underline underline-offset-4" href="mailto:manager@petitsot.com">manager@petitsot.com</a>.
            Include the artwork title or page URL, your intended use or concern, and contact details. Permission
            is granted only when confirmed by the relevant rights holder.
          </p>
        </section>
      </div>
    </main>
  );
}
