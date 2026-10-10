import { Link } from 'react-router-dom';
import { LegalDocument, type LegalSection } from '@/components/LegalDocument';
import { DELETION_GRACE_DAYS, LEGAL_CONTACT_EMAIL, LEGAL_COUNTRY, LEGAL_ENTITY } from '@/lib/legal';

const mail = <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>;

const sections: LegalSection[] = [
  {
    id: 'acceptance',
    title: 'Accepting these terms',
    body: (
      <>
        <p>
          By creating an account or using {LEGAL_ENTITY} (the "service"), you agree to these Terms &amp; Conditions and
          to our <Link to="/privacy">Privacy Policy</Link>. If you do not agree, please do not use the service.
        </p>
        <p>
          You must be at least 18 years old and able to enter into a binding contract under Indian law. If you use the
          service for a business, you confirm that you are allowed to accept these terms for that business.
        </p>
      </>
    ),
  },
  {
    id: 'service',
    title: 'What the service is, and is not',
    body: (
      <>
        <p>
          {LEGAL_ENTITY} is a software tool for creating, saving, printing and exporting transaction receipts from
          details that you enter.
        </p>
        <p>
          <strong>We are not a bank, payment system, money transfer service or business correspondent.</strong> We do not
          move, hold or verify money, and we do not check that a transaction actually took place. A receipt only shows the
          details you entered.
        </p>
      </>
    ),
  },
  {
    id: 'account',
    title: 'Your account',
    body: (
      <ul>
        <li>Give accurate information when you sign up, and keep it up to date.</li>
        <li>Keep your password secret. You are responsible for everything done through your account.</li>
        <li>Tell us at {mail} straight away if you think someone else has used your account.</li>
      </ul>
    ),
  },
  {
    id: 'your-data',
    title: "Your content and your customers' information",
    body: (
      <>
        <p>
          You own the information you enter (your "content"). You allow us to store, process, display and print it only
          as needed to provide the service to you, as described in the Privacy Policy.
        </p>
        <p>When you enter your customers' details, you confirm that:</p>
        <ul>
          <li>you have a lawful reason to collect and use those details, and have informed your customers where the law requires;</li>
          <li>the details are accurate to the best of your knowledge, and every receipt matches a real transaction;</li>
          <li>you will use the receipts and data in line with applicable law, including the Digital Personal Data Protection Act, 2023.</li>
        </ul>
        <p>Never enter card numbers, CVV, UPI PINs, OTPs or banking passwords.</p>
        <p>
          You are responsible for the accuracy of your receipts and for keeping your own copies of records you need by
          law (for example for tax or accounting). You can download your receipts at any time.
        </p>
      </>
    ),
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable use',
    body: (
      <>
        <p>You must not use the service to:</p>
        <ul>
          <li>create false, misleading or forged receipts, or receipts for transactions that did not happen;</li>
          <li>commit or hide fraud, money laundering or any other illegal activity;</li>
          <li>impersonate another person, business or bank;</li>
          <li>enter information you have no right to use;</li>
          <li>try to access other users' accounts or data, or test, scan or break the security of the service;</li>
          <li>overload the service, scrape it, or copy, resell or reverse-engineer it.</li>
        </ul>
        <p>We may remove content or suspend accounts that break these rules, and report illegal activity to the authorities.</p>
      </>
    ),
  },
  {
    id: 'fees',
    title: 'Fees',
    body: (
      <p>
        The service is currently free. If we introduce paid features, we will tell you in advance, and you will not be
        charged unless you choose to use them.
      </p>
    ),
  },
  {
    id: 'availability',
    title: 'Availability and changes to the service',
    body: (
      <p>
        We work to keep the service running and your data safe, but we cannot promise it will always be available or
        error-free. We may change, add or remove features, and may pause the service for maintenance. Where a change
        significantly affects you, we will try to tell you beforehand.
      </p>
    ),
  },
  {
    id: 'ip',
    title: 'Intellectual property',
    body: (
      <p>
        The service, including its software, design, name and logo, belongs to {LEGAL_ENTITY}. These terms give you a
        personal, non-transferable right to use the service; they do not give you any other rights in it. Your content
        remains yours.
      </p>
    ),
  },
  {
    id: 'termination',
    title: 'Ending your use of the service',
    body: (
      <>
        <p>
          You can delete your account at any time from the Profile page. You can restore it by logging in within
          {' '}{DELETION_GRACE_DAYS} days; after that it is permanently erased, as explained in
          the <Link to="/privacy">Privacy Policy</Link>.
        </p>
        <p>
          We may suspend or close your account if you seriously or repeatedly break these terms, if the law requires us
          to, or to protect other users. Where reasonable, we will tell you first and give you a chance to download your
          receipts.
        </p>
      </>
    ),
  },
  {
    id: 'disclaimer',
    title: 'Disclaimer',
    body: (
      <p>
        The service is provided "as is" and "as available". To the extent permitted by law, we make no promises beyond
        those in these terms, including that receipts or Smart Paste results will be free of errors. Always check a
        receipt before you print or share it.
      </p>
    ),
  },
  {
    id: 'liability',
    title: 'Limitation of liability',
    body: (
      <>
        <p>To the extent permitted by law, we are not liable for:</p>
        <ul>
          <li>errors in details you entered or in receipts you printed or shared;</li>
          <li>disputes between you and your customers, banks or any other party;</li>
          <li>loss of profit, business, goodwill or data, or any indirect or consequential loss.</li>
        </ul>
        <p>
          Our total liability to you for any claim about the service is limited to the greater of ₹1,000 or the amount
          you paid us for the service in the 12 months before the claim. Nothing in these terms limits liability that
          cannot be limited under Indian law.
        </p>
      </>
    ),
  },
  {
    id: 'indemnity',
    title: 'Indemnity',
    body: (
      <p>
        You agree to compensate us for any claims, losses or costs (including reasonable legal fees) arising from your
        misuse of the service, the information you enter, or your breach of these terms or of the law.
      </p>
    ),
  },
  {
    id: 'law',
    title: 'Governing law and disputes',
    body: (
      <p>
        These terms are governed by the laws of {LEGAL_COUNTRY}. Please contact us first so we can try to resolve any
        dispute informally. Any dispute that cannot be resolved this way will be subject to the jurisdiction of the
        competent courts in {LEGAL_COUNTRY}.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to these terms',
    body: (
      <p>
        We may update these terms. We will show the new date at the top, and for important changes we will ask you to
        accept the updated terms in the app before you continue. If you do not agree, you can delete your account.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact',
    body: <p>Questions or complaints about these terms: {mail}.</p>,
  },
];

export default function Terms() {
  return (
    <LegalDocument
      title="Terms & Conditions"
      intro={
        <p>
          These terms are an agreement between you and {LEGAL_ENTITY}. They explain how you may use the service and
          what each of us is responsible for. Please read them together with our <Link to="/privacy" className="font-medium text-primary hover:underline">Privacy Policy</Link>.
        </p>
      }
      summary={
        <ul className="list-disc space-y-1 pl-5">
          <li>{LEGAL_ENTITY} is a receipt tool. It does not move money or verify transactions.</li>
          <li>You are responsible for the details you enter and for having your customers' permission to use them.</li>
          <li>Never create fake receipts or use the service for anything illegal.</li>
          <li>The service is free today; you can delete your account at any time.</li>
        </ul>
      }
      sections={sections}
    />
  );
}
