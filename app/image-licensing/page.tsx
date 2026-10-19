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
          <h2 className="mb-2 text-xl">1. Scope and ownership</h2>
          <p>
            This notice applies to artwork images, photographs, text, graphics and other visual or editorial
            material published on petitsot.com, unless a specific credit or separate licence says otherwise.
            Original artwork and photographs may be protected by copyright automatically under applicable law.
          </p>
          <p className="mt-2">
            The paintings presented on this website are attributed to artist Olga Trikhleb. Copyright in a
            painting, a photograph of that painting, website text and other materials can belong to different
            rights holders. Rights are retained by the relevant author or rights holder; the website name
            PETITSOT Studio is not, by itself, a statement that every right has been transferred to a company.
            Where an image is credited to another person, that credit takes precedence for identifying the
            stated author, but does not itself establish the complete chain of title.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">2. What buying an original painting means</h2>
          <p>
            Buying or owning a physical original painting does not, by itself, transfer copyright or grant
            permission to reproduce, publish, merchandise, distribute or commercially exploit the painting's
            image. Any separate rights transfer or licence must be expressly agreed in writing by the relevant
            rights holder.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">3. Use that is not permitted without permission</h2>
          <p>
            Unless a licence or applicable law permits it, you may not copy, download for republication,
            reproduce, adapt, alter, remove attribution or rights notices from, distribute, sell, publicly
            display, publish, use commercially, or incorporate protected material from this website into
            products, advertising, publications, datasets or AI training workflows. This notice does not remove
            or limit exceptions, limitations or other rights provided by applicable law.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">4. Linking and sharing</h2>
          <p>
            You may link to a publicly accessible page on petitsot.com using an ordinary text link, provided
            that the link is not misleading and does not imply endorsement or affiliation. Sharing a link to
            a page is different from copying or re-uploading the image itself. Please do not imply that you
            own the artwork or that Olga Trikhleb or PETITSOT Studio endorses your product or service without
            written permission.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">5. Requesting a licence</h2>
          <p>
            Written permission is required for uses that need a licence. Email{" "}
            <a className="underline underline-offset-4" href="mailto:manager@petitsot.com">manager@petitsot.com</a>{" "}
            before using the material and include:
          </p>
          <ul className="mt-2 list-disc space-y-2 pl-6">
            <li>the artwork title and the relevant page or image URL;</li>
            <li>the intended use, format, audience and publication/platform;</li>
            <li>whether the use is commercial, promotional, editorial or personal;</li>
            <li>territory, duration, expected distribution/reach and any proposed edits;</li>
            <li>your name and contact details.</li>
          </ul>
          <p className="mt-2">
            A licence is granted only when the authorised rights holder confirms it in writing and its scope
            and conditions are clear. Silence, a credit line, a link to this website or purchase of a physical
            painting does not constitute permission. Fees, attribution, permitted formats, territory, duration
            and exclusivity, if any, will be agreed individually.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">6. Credits and rights notices</h2>
          <p>
            Where appropriate and agreed, a suggested credit may be “Artwork by Olga Trikhleb”. The appropriate
            credit for a photograph or other material may differ. A credit is not a substitute for a licence
            where one is required, and a licence does not remove any applicable moral rights.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">7. Third-party material and external platforms</h2>
          <p>
            Some pages may link to Etsy, Instagram, Pinterest or other third-party services. Their content,
            terms and intellectual-property policies are governed by the relevant platform and rights holders.
            This notice does not claim rights in material owned by third parties.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">8. Suspected infringement or incorrect attribution</h2>
          <p>
            If you believe material on this website infringes your rights or is incorrectly attributed, email{" "}
            <a className="underline underline-offset-4" href="mailto:manager@petitsot.com">manager@petitsot.com</a>{" "}
            with the relevant URL, identification of the material, an explanation of your rights or concern,
            and a way to contact you. We will review credible notices and take appropriate steps where warranted.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">9. No transfer of rights; applicable law</h2>
          <p>
            Except for permission expressly granted in writing or rights that cannot lawfully be excluded,
            no intellectual-property rights are transferred by browsing this website. Copyright exceptions
            and enforcement are governed by the applicable laws and may vary by jurisdiction. Nothing in this
            notice is intended to exclude rights or remedies that cannot be excluded by law.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">10. Contact</h2>
          <p>
            Licensing and copyright enquiries:{" "}
            <a className="underline underline-offset-4" href="mailto:manager@petitsot.com">manager@petitsot.com</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
