import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Returns & Refunds | PETITSOT STUDIO",
  description:
    "Return and refund information for original paintings by Olga Trikhleb purchased through PETITSOT STUDIO's marketplace listings.",
  alternates: { canonical: "https://www.petitsot.com/return-policy" },
  robots: { index: true, follow: true },
};

export default function ReturnPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 text-neutral-900">
      <p className="mb-3 text-xs uppercase tracking-[0.2em] text-neutral-500">PETITSOT STUDIO</p>
      <h1 className="mb-4 text-4xl tracking-tight">Returns & Refunds</h1>
      <p className="mb-10 text-sm text-neutral-500">Last updated: 20 October 2026</p>

      <div className="space-y-8 leading-7">
        <section>
          <h2 className="mb-2 text-xl">1. Where your purchase is made</h2>
          <p>
            PETITSOT.COM is an artist portfolio. When a work is available to buy, the purchase is completed
            through the marketplace linked on that artwork's page, such as Etsy or Sashe; we do not currently
            take payment or complete checkout on this website. Please start a return or refund request through
            the same marketplace and the account used for the order, so the order can be identified and its
            return process followed.
          </p>
          <p className="mt-2">
            Marketplace procedures apply alongside any mandatory consumer rights that cannot legally be
            excluded. If this policy and applicable consumer law differ, the mandatory legal rights apply.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">2. Change of mind</h2>
          <p>
            Where the law gives you a right to withdraw from a distance purchase, consumers in the European
            Union generally have 14 days from the day they receive the artwork to notify the seller that they
            wish to withdraw, unless a legal exception applies. After notifying the seller, the artwork must
            generally be sent back within a further 14 days. Please use the marketplace's order messaging
            system or contact the seller through the order to receive return instructions before sending it.
          </p>
          <p className="mt-2">
            The buyer is responsible for the direct cost of returning an item when the buyer has been informed
            of this responsibility before purchase and the return is not due to an error on our part. Please
            package the artwork securely to help prevent transit damage. You may handle the artwork as
            reasonably necessary to establish its nature and characteristics; you may be responsible for any
            diminished value caused by handling beyond what is necessary, as provided by law.
          </p>
          <p className="mt-2">
            Statutory withdrawal rights may not apply to certain legally exempt orders, such as artwork made
            to the customer's specifications or clearly personalised for them. Any exception will be applied
            only where permitted by applicable law.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">3. Damaged, incorrect or missing items</h2>
          <p>
            If an artwork arrives damaged, you receive a different item, or your order does not arrive, contact
            the seller through the marketplace as soon as reasonably possible. Include your order number and
            clear photographs of the packaging and artwork where relevant. We will review the issue and work
            with you through the marketplace to arrange the remedy required by applicable law and the
            marketplace's procedures. Your statutory rights are not limited by this request for information.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">4. Refunds</h2>
          <p>
            Approved refunds are processed through the original marketplace and, where possible, the original
            payment method. Where a statutory withdrawal applies, the refund is generally due within 14 days
            after the seller is informed of the withdrawal; the seller may withhold it until the artwork is
            received back or you provide evidence that it has been sent back, whichever happens first. The
            refund includes the standard outbound delivery cost where required by law, but not additional
            costs arising from choosing a more expensive delivery option.
          </p>
          <p className="mt-2">
            For returns because an item is faulty, damaged or incorrectly supplied, return costs and remedies
            will be handled according to applicable consumer law and the marketplace's process.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl">5. Contact</h2>
          <p>
            For help with a return, contact the seller through the marketplace where you placed the order, or
            email{" "}
            <a className="underline underline-offset-4" href="mailto:manager@petitsot.com">
              manager@petitsot.com
            </a>
            . Include the marketplace and order reference, but do not send payment-card details.
          </p>
        </section>
      </div>
    </main>
  );
}
