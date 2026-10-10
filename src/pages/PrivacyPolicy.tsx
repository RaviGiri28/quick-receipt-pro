import { Link } from 'react-router-dom';
import { LegalDocument, type LegalSection } from '@/components/LegalDocument';
import {
  DELETION_GRACE_DAYS, INACTIVITY_NOTICE_DAYS, INACTIVITY_YEARS, LEGAL_CONTACT_EMAIL, LEGAL_COUNTRY, LEGAL_ENTITY,
} from '@/lib/legal';

const mail = <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>;

// Keep this in step with what the app actually does: the data it stores, the services
// it uses (backend config/*.js, frontend lib/analytics.ts) and the retention rules
// (backend services/retention.js).
const sections: LegalSection[] = [
  {
    id: 'who-we-are',
    title: 'Who we are',
    body: (
      <>
        <p>
          {LEGAL_ENTITY} ("we", "us") provides an online tool that lets shops and money transfer retailers
          ("you") create, save and print transaction receipts. We operate from {LEGAL_COUNTRY}.
        </p>
        <p>For any privacy question or request, write to {mail}.</p>
      </>
    ),
  },
  {
    id: 'what-we-collect',
    title: 'Information we collect',
    body: (
      <>
        <p><strong>Your account details</strong>, which you give us when you sign up or edit your profile:</p>
        <ul>
          <li>your name, email address, personal phone number and password (stored only as a one-way hash; we cannot read it);</li>
          <li>your business name, business address, business phone number and, if you upload one, your business logo;</li>
          <li>the names of any extra receipt fields you create in Settings.</li>
        </ul>
        <p><strong>Receipt details</strong>, which you enter when you create or edit a receipt. These are about your customers and their transactions:</p>
        <ul>
          <li>account holder name, bank account number, IFSC code and bank name;</li>
          <li>amount, date, status (success or pending), transaction ID and reference number;</li>
          <li>customer mobile number, notes, and values of your extra receipt fields.</li>
        </ul>
        <p>
          The Smart Paste feature reads text you paste only inside your browser to fill the form; only the
          receipt you save is sent to us.
        </p>
        <p><strong>Support messages</strong>: the name, email address, subject and message you send us through the Support page.</p>
        <p>
          <strong>Usage statistics</strong>: if analytics is enabled, we use Google Analytics for Firebase to count page
          views and feature use (for example "receipt printed"), together with general device, browser and approximate
          location information that Google derives from your connection. Usage is linked to your account only by its
          internal account number. We never send receipt details, customer details, names, email addresses or amounts
          to analytics. You can turn analytics off at any time in
          Settings → Privacy.
        </p>
        <p>
          <strong>Technical information</strong>: your IP address is used briefly to protect the login and sign-up forms
          from abuse, and our hosting providers keep standard server logs.
        </p>
        <p>
          <strong>On your device</strong>: your browser stores your login session, your theme and receipt display
          preferences, dismissed announcements and your analytics choice. Google Analytics may store its own identifier
          (a cookie). We do not use advertising cookies.
        </p>
        <p>We do not ask for, and you must not enter, card numbers, CVV, UPI PINs, OTPs or banking passwords.</p>
      </>
    ),
  },
  {
    id: 'your-customers',
    title: "Your customers' information",
    body: (
      <>
        <p>
          When you enter your customers' details on a receipt, you decide what is entered and why. For that information
          you are responsible, under the Digital Personal Data Protection Act, 2023, for having a lawful reason to
          collect it (such as issuing a receipt for a transaction your customer asked for) and for telling your
          customers about it where the law requires.
        </p>
        <p>
          We store and process that information only on your behalf and only to provide the service to you. We do not
          use it for any other purpose, and we do not contact your customers.
        </p>
        <p>If one of your customers asks us about their information, we will refer them to you and help you respond.</p>
      </>
    ),
  },
  {
    id: 'how-we-use',
    title: 'How we use information',
    body: (
      <>
        <ul>
          <li>to create, store, show, export and print your receipts and run your account;</li>
          <li>to print your business details and logo on your receipts;</li>
          <li>to answer your support requests;</li>
          <li>to keep the service secure, for example by limiting repeated login attempts and ending old sessions;</li>
          <li>to email you about your account, such as a notice before an unused account is deleted;</li>
          <li>to understand, in aggregate, which features are used so we can improve the app.</li>
        </ul>
        <p>
          <strong>We do not sell or rent your information or your customers' information, we do not show advertising,
          and we do not use receipt details for marketing.</strong>
        </p>
      </>
    ),
  },
  {
    id: 'sharing',
    title: 'Service providers and where data is stored',
    body: (
      <>
        <p>We use these providers to run the service. They process information only on our instructions:</p>
        <ul>
          <li><strong>Netlify</strong>: hosts and delivers the website.</li>
          <li><strong>Render</strong>: runs our application servers, which process every request you make.</li>
          <li><strong>TiDB Cloud (PingCAP)</strong>: our database, which stores account, receipt and support data. It is located in Singapore.</li>
          <li><strong>Cloudinary</strong>: stores business logo images.</li>
          <li><strong>Google Analytics for Firebase</strong>: usage statistics, as described above.</li>
          <li><strong>Our email provider</strong>: delivers support messages and account emails.</li>
          <li><strong>Google Fonts</strong>: serves the fonts the app uses, so Google receives your IP address when the page loads.</li>
        </ul>
        <p>
          Some of these providers store or process information outside {LEGAL_COUNTRY}, including in Singapore and the
          United States. We only transfer information abroad as permitted by Indian law.
        </p>
        <p>
          We may also disclose information when required by law, a court order or a lawful request from a government
          authority, or to protect the rights and safety of our users or the public.
        </p>
      </>
    ),
  },
  {
    id: 'security',
    title: 'Security',
    body: (
      <>
        <ul>
          <li>All traffic between your browser, our servers and our database is encrypted (HTTPS / TLS).</li>
          <li>Passwords are stored only as secure hashes.</li>
          <li>Receipts can be read only through the account that created them.</li>
          <li>Sessions expire, and changing your password signs out all other devices.</li>
          <li>Login, sign-up and password attempts are rate limited.</li>
        </ul>
        <p>
          No system is perfectly secure. If a breach affects your information, we will inform you and the authorities as
          required by law.
        </p>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'How long we keep information',
    body: (
      <>
        <ul>
          <li><strong>While your account is active</strong>, we keep your account details and receipts so you can use them.</li>
          <li><strong>A receipt you delete</strong> is removed from our database immediately.</li>
          <li>
            <strong>If you delete your account</strong>, you can restore it by logging in within {DELETION_GRACE_DAYS} days.
            After that, your account, business details, receipts and support messages are permanently erased.
          </li>
          <li>
            <strong>If you do not use your account for {INACTIVITY_YEARS} years</strong>, we email you at least {INACTIVITY_NOTICE_DAYS} days
            before deleting it, and send a reminder shortly before. Logging in keeps your account. If you do not, it is
            permanently erased as above.
          </li>
          <li>
            Erased data can remain in encrypted database backups for up to {DELETION_GRACE_DAYS} more days, until those
            backups expire.
          </li>
        </ul>
        <p>We may keep limited information for longer only where the law requires us to.</p>
        <p>
          If you need your receipts for your own records (for example for tax or accounting), download them before
          deleting your account.
        </p>
      </>
    ),
  },
  {
    id: 'your-rights',
    title: 'Your rights and choices',
    body: (
      <>
        <p>Under Indian law, including the Digital Personal Data Protection Act, 2023, you can:</p>
        <ul>
          <li><strong>access and download</strong> your receipts from the Profile page (Excel) and see your account details on the Profile page;</li>
          <li><strong>correct</strong> your account details and receipts at any time;</li>
          <li><strong>delete</strong> individual receipts, or your whole account from the Profile page;</li>
          <li><strong>withdraw consent</strong> by deleting your account (this does not affect anything done before);</li>
          <li><strong>turn off analytics</strong> in Settings → Privacy;</li>
          <li><strong>nominate</strong> a person to exercise these rights for you in case of death or incapacity;</li>
          <li><strong>raise a grievance</strong> with us, and, if you are not satisfied with our response, complain to the Data Protection Board of India.</li>
        </ul>
        <p>To make any request, email {mail} from your registered email address.</p>
      </>
    ),
  },
  {
    id: 'children',
    title: 'Children',
    body: <p>The service is meant for businesses and is not for anyone under 18. We do not knowingly collect information from children.</p>,
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    body: (
      <p>
        We may update this policy as the service or the law changes. We will show the new date at the top, and for
        important changes we will ask you to review and accept the updated policy in the app before you continue.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact and grievance officer',
    body: (
      <>
        <p>
          For questions, requests or complaints about privacy, contact our grievance officer at {mail}. We will
          acknowledge your message within 7 days and resolve it as soon as possible, within the time the law requires.
        </p>
        <p>
          Please also read our <Link to="/terms">Terms &amp; Conditions</Link>.
        </p>
      </>
    ),
  },
];

export default function PrivacyPolicy() {
  return (
    <LegalDocument
      title="Privacy Policy"
      intro={
        <p>
          This policy explains what information {LEGAL_ENTITY} collects, why, where it is stored, how long we keep it,
          and the choices you have. It applies to our website and app.
        </p>
      }
      summary={
        <ul className="list-disc space-y-1 pl-5">
          <li>We store your account details and the receipts you create on our servers, so you can use them from any device.</li>
          <li>Receipts contain your customers' bank and contact details. You decide what to enter; we use it only to run the service for you.</li>
          <li>We never sell data, show ads, or use receipt details for marketing.</li>
          <li>You can download or delete your receipts and your account at any time.</li>
        </ul>
      }
      sections={sections}
    />
  );
}
