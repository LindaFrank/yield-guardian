import { ArrowLeft, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const sections = [
  {
    title: '1. Acceptance of Terms and Privacy Policy',
    paragraphs: [
      "Before using Yield Guardian's portfolio analysis features, users must affirmatively acknowledge these Terms, Privacy & Educational Platform Disclosures. The acknowledgment should not be pre-selected.",
      'The application may present a concise acknowledgment such as: I have read and agree to the Yield Guardian Terms & Conditions and acknowledge the Privacy Policy. The Terms & Conditions and Privacy Policy should be separately accessible to the user.',
      'Yield Guardian should retain the applicable terms version, privacy-policy version, and acceptance date/time. A returning user who has already accepted the current versions need not be asked to accept them again unless the applicable terms or privacy policy materially change.',
    ],
  },
  {
    title: '2. Educational and Informational Platform',
    paragraphs: [
      'Yield Guardian is an educational and informational platform designed to help users explore and better understand investment portfolios, dividend income, dividend yield, diversification, portfolio history, and potential portfolio alternatives.',
      'Yield Guardian is not a broker-dealer, investment adviser, financial planner, tax adviser, or trading platform. Information, calculations, analyses, projections, comparisons, securities, strategies, and other content presented by Yield Guardian are provided for educational and informational purposes only and are not individualized investment, financial, legal, or tax advice.',
      'Nothing presented by Yield Guardian constitutes a recommendation, solicitation, instruction, or offer to buy, sell, hold, or trade any security. Users may choose to consult a qualified financial, investment, tax, legal, or other professional before making financial or investment decisions.',
    ],
  },
  {
    title: '3. Portfolio Alternatives and Strategy Illustrations',
    paragraphs: [
      "Yield Guardian may identify and display securities as potential alternatives to securities within a user's portfolio. Alternatives are presented for educational, analytical, and comparative purposes based on the criteria and information used in the analysis.",
      'The inclusion, ranking, comparison, labeling, or display of a security does not constitute an endorsement or recommendation to purchase, sell, hold, or otherwise transact in that security.',
      'Strategy screens may model changes to a portfolio, including securities, share quantities, estimated prices, allocations, dividend yields, income differences, or other potential results. These are illustrations of the assumptions and calculations used by the analysis, not directions to complete a transaction.',
    ],
  },
  {
    title: '4. Desired Portfolio Yield',
    paragraphs: [
      'Yield Guardian may allow users to select a Desired Yield for portfolio analysis. A Desired Yield is an analytical target selected by the user and is not a guaranteed result.',
      'Yield Guardian may analyze potential portfolio alternatives that could move a portfolio toward the selected yield. Available securities, portfolio composition, diversification considerations, market conditions, security prices, dividend rates, and other factors may prevent the selected yield from being achieved.',
      'A calculated or modeled portfolio yield does not guarantee that the same yield will actually be received or maintained in the future.',
    ],
  },
  {
    title: '5. Dividends and Dividend Information',
    paragraphs: [
      'Dividends and dividend yields are not guaranteed. Companies may increase, decrease, suspend, modify, or discontinue dividend payments at any time.',
      'Dividend amounts, yields, projected dividend income, historical information, and other dividend-related information presented by Yield Guardian are based on available information, including company-reported financial results, dividend announcements, published statements, and other data available at the time of analysis.',
      'Projected or estimated dividend income is an analytical estimate and does not guarantee future dividend payments, income, yield, or investment performance. Actual dividends and investment results may differ from amounts displayed by Yield Guardian.',
    ],
  },
  {
    title: '6. Educational Transaction Information and Follow-Up Steps',
    paragraphs: [
      'When reviewing an illustrated portfolio strategy or alternative, Yield Guardian may provide follow-up educational information explaining how the illustrated portfolio change could be implemented independently by the user. This information may include securities, quantities, estimated prices, allocations, or other details used in the analysis.',
      'This information describes the assumptions and mechanics of the illustrated strategy. It is not a recommendation, directive, or instruction that the user should complete the transaction.',
      "Yield Guardian does not place, initiate, authorize, transmit, or execute securities orders and does not act on the user's behalf with a brokerage or financial institution.",
      "If a user independently chooses to make a portfolio change, the user is responsible for evaluating the transaction and executing it through the user's own brokerage or other authorized financial service provider.",
    ],
  },
  {
    title: '7. Trade Tracking, Portfolio Records, and Reporting',
    paragraphs: [
      'Yield Guardian may allow users to record or report trades and other portfolio transactions that occurred outside the Yield Guardian platform. Yield Guardian may use this information for portfolio recordkeeping, historical tracking, performance analysis, dividend analysis, calculations, and reporting.',
      'Recording or reporting a transaction in Yield Guardian does not cause a trade to occur and does not transmit a trade instruction to a brokerage or financial institution.',
      'Users are responsible for accurately entering or reporting completed transaction information. Historical records, portfolio values, performance calculations, dividend calculations, and reports may be affected by incomplete, inaccurate, or outdated information.',
    ],
  },
  {
    title: '8. Privacy and Personally Identifiable Information',
    paragraphs: [
      'Yield Guardian is designed so that portfolio analysis itself does not require personally identifiable information (PII) about the owner of a portfolio. Users should not include unnecessary PII in portfolio information submitted for analysis.',
      'Portfolio analysis does not require information such as a Social Security number, brokerage account number, or home address. Personal information may nevertheless be collected when necessary for account creation, authentication, communication, customer support, security, or payment processing.',
      'Payment information needed to purchase paid Yield Guardian services may be processed by a third-party payment service provider. The production Privacy Policy should accurately identify the categories of personal information collected, the service providers used, the purposes for processing, retention practices, user rights, and whether Yield Guardian itself receives or stores full payment-card information.',
      'Yield Guardian may retain portfolio information, user-reported transactions, analysis history, and related data as necessary to provide portfolio tracking, historical analysis, calculations, and reporting. The production Privacy Policy should accurately describe the actual storage, retention, security, deletion, and sharing practices implemented by the application.',
    ],
  },
  {
    title: '9. Data and Calculations',
    paragraphs: [
      'Yield Guardian uses available financial information and user-provided portfolio information to perform calculations and analyses. Financial data may contain errors, omissions, delays, changes, or inaccuracies, and calculations may be affected by the accuracy and completeness of the underlying information.',
      'Users should independently verify information they consider important before making financial decisions.',
    ],
  },
  {
    title: '10. No Compensation or Company Decision-Making Role',
    paragraphs: [
      'Yield Guardian does not receive commissions, referral fees, or other financial compensation from companies or securities merely because a security is displayed, compared, or identified as an alternative within a portfolio analysis.',
      'Yield Guardian and its representatives do not serve on the boards of directors of companies whose securities are presented by the platform and do not participate in those companies’ investment, dividend, or corporate decision-making processes.',
      'The appearance of a company or security within Yield Guardian should not be interpreted as a paid endorsement or as an indication that the company has approved or endorsed Yield Guardian.',
    ],
  },
  {
    title: '11. Investment Risk',
    paragraphs: [
      'All investing involves risk. Security prices, dividend payments, dividend yields, company performance, economic conditions, interest rates, tax laws, and market conditions can change. Users may lose some or all of the money invested in a security.',
      'Historical performance, historical dividend payments, calculated yields, projections, simulations, comparisons, and modeled portfolio results do not guarantee future results.',
    ],
  },
  {
    title: '12. User Responsibility',
    paragraphs: [
      'The user retains complete responsibility and control over all investment and financial decisions. Yield Guardian provides educational information and analytical tools to help users explore potential choices, but Yield Guardian does not make financial decisions for users.',
      'Users are responsible for determining whether any information, security, portfolio change, or strategy presented through Yield Guardian is appropriate for their individual circumstances.',
      'To the extent permitted by applicable law, Yield Guardian is not responsible for investment decisions made by users or for financial losses, lost opportunities, dividend reductions, changes in investment value, tax consequences, or other financial outcomes resulting from decisions made using information provided through the platform.',
    ],
  },
];

const acknowledgments = [
  'I have read and understand these Terms, Privacy & Educational Platform Disclosures.',
  'Yield Guardian is an educational and informational platform and does not provide individualized investment advice.',
  'Securities and strategies displayed by Yield Guardian are alternatives for educational and comparative analysis and are not recommendations to buy, sell, or hold securities.',
  'My Desired Yield is an analytical target and is not guaranteed.',
  'Dividends, dividend yields, projected dividend income, and investment performance are not guaranteed.',
  'Yield Guardian may provide educational follow-up information describing the mechanics of an illustrated portfolio change, but does not place, initiate, authorize, transmit, or execute trades on my behalf.',
  'Yield Guardian may record and track trades or portfolio transactions that I report for recordkeeping, historical analysis, calculations, and reporting; recording a transaction in Yield Guardian does not cause a trade to occur.',
  'I am responsible for independently deciding whether to make any portfolio change and for executing any transaction through my own brokerage or authorized financial service provider.',
  'Investing involves risk, including the possible loss of principal.',
  'I may consult a qualified financial, investment, tax, legal, or other professional before making financial decisions.',
];

export default function Terms() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
          <Button asChild variant="outline" size="sm">
            <Link to="/auth"><ArrowLeft className="mr-2 h-4 w-4" />Back to sign up</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href="/Yield_Guardian_Terms_Privacy_Disclosures.pdf" download>
              <Download className="mr-2 h-4 w-4" />Download PDF
            </a>
          </Button>
        </div>

        <article className="space-y-8 text-sm leading-7 text-muted-foreground">
          <header className="space-y-3 text-center">
            <p className="text-sm font-semibold text-primary">Yield Guardian</p>
            <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Terms, Privacy &amp; Educational Platform Disclosures</h1>
            <p className="text-xs font-medium uppercase text-muted-foreground">Final Product Draft for Legal Review · September 12, 2026</p>
          </header>

          <aside className="border-l-4 border-primary bg-muted/40 px-4 py-3 text-foreground">
            <strong>Important:</strong> This document is intended to describe Yield Guardian&apos;s product boundaries, privacy approach, disclosures, and user acknowledgments in clear language. Because Yield Guardian provides financial portfolio analysis, this document and the implemented product flow should be reviewed by qualified legal counsel before production release.
          </aside>

          {sections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>
          ))}

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">13. User Acknowledgment</h2>
            <p>By checking the acknowledgment box and continuing to use Yield Guardian, I acknowledge that:</p>
            <ul className="list-disc space-y-2 pl-6">
              {acknowledgments.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <p className="border border-border bg-muted/40 px-4 py-3 font-medium text-foreground">
              I have read and agree to the Yield Guardian Terms &amp; Conditions and acknowledge the Privacy Policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">14. Recommended Short In-App Disclosures</h2>
            <p><strong className="text-foreground">General footer:</strong> For educational and informational purposes only. Yield Guardian does not provide investment advice or execute trades. Securities shown are alternatives for analysis, not recommendations.</p>
            <p><strong className="text-foreground">Desired Yield:</strong> Your Desired Yield is a target, not a guarantee. Market conditions, available securities, dividend changes, and portfolio constraints may prevent the selected yield from being achieved.</p>
            <p><strong className="text-foreground">Dividend results:</strong> Dividends are not guaranteed. Estimates are based on company-reported financial information and published dividend statements available at the time of analysis. Actual results may differ.</p>
            <p><strong className="text-foreground">Alternative Strategy:</strong> Illustrative analysis only. Alternatives are presented for comparison and are not recommendations to buy, sell, or hold a security. Prices, dividends, yields, and actual results may change.</p>
            <p><strong className="text-foreground">Transaction / how-to:</strong> Educational steps only. Yield Guardian may explain how an illustrated portfolio change could be made, but does not recommend, place, transmit, or execute trades. You decide whether to proceed and execute transactions independently through your brokerage.</p>
            <p><strong className="text-foreground">Trade tracking:</strong> Yield Guardian records transactions you report for portfolio tracking, history, calculations, and reporting. Recording a transaction in Yield Guardian does not execute or transmit a trade.</p>
            <p><strong className="text-foreground">Portfolio privacy:</strong> Yield Guardian does not require personally identifiable information to analyze a portfolio. Please do not include unnecessary personal identifying information in portfolio data submitted for analysis.</p>
          </section>
        </article>
      </div>
    </main>
  );
}