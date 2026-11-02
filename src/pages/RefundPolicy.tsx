import { Link } from 'react-router-dom';
import { LegalDocument, type LegalSection } from '@/components/LegalDocument';
import { LEGAL_CONTACT_EMAIL, LEGAL_COUNTRY, LEGAL_ENTITY, LEGAL_OPERATOR } from '@/lib/legal';

const mail = <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>;

const sections: LegalSection[] = [
  {
    id: 'cancellation',
    title: 'Cancellation',
    body: (
      <p>
        {LEGAL_ENTITY} plans are one-time purchases that give access for a fixed period. They do not renew
        automatically, so you do not need to cancel. Your plan simply ends on its expiry date.
      </p>
    ),
  },
  {
    id: 'free-trial',
    title: 'Free trial and change of mind',
    body: (
      <p>
        New accounts get a free trial so you can try the service before paying. For this reason, purchases are not
        refundable for a change of mind, for not using the plan, or for days left unused on a plan.
      </p>
    ),
  },
  {
    id: 'eligible',
    title: 'When we refund',
    body: (
      <>
        <p>You are eligible for a refund if:</p>
        <ul>
          <li>you were charged twice for the same order;</li>
          <li>you were charged and we cannot activate your plan; or</li>
          <li>a serious technical fault on our side prevents you from using the service and we cannot fix it within a reasonable time.</li>
        </ul>
        <p>Plans on accounts deactivated for breaking our <Link to="/terms">Terms &amp; Conditions</Link> are not refundable.</p>
      </>
    ),
  },
  {
    id: 'request',
    title: 'How to request a refund',
    body: <p>Email {mail} within 7 days of payment with your registered email and Order ID. Your Order ID is in your order confirmation email.</p>,
  },
  {
    id: 'timeline',
    title: 'Timeline',
    body: <p>We review requests within 3 working days. Approved refunds go to your original payment method within 5-7 working days.</p>,
  },
  {
    id: 'contact',
    title: 'Contact',
    body: <p>{LEGAL_ENTITY} is operated by {LEGAL_OPERATOR}, {LEGAL_COUNTRY}. Questions about this policy: {mail}.</p>,
  },
];

export default function RefundPolicy() {
  return (
    <LegalDocument
      title="Refund & Cancellation Policy"
      intro={<p>This policy explains how cancellation and refunds work for paid {LEGAL_ENTITY} plans.</p>}
      summary={
        <ul className="list-disc space-y-1 pl-5">
          <li>Plans do not renew automatically, so there is nothing to cancel.</li>
          <li>You can try the service on a free trial, so change-of-mind refunds are not offered.</li>
          <li>Double charges, plans we cannot activate and serious faults on our side are eligible for a refund.</li>
          <li>Request a refund within 7 days of payment.</li>
        </ul>
      }
      sections={sections}
    />
  );
}
