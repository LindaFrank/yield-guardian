/**
 * Wording of the Terms, Privacy & Educational Platform Disclosures page.
 * The downloadable PDF is rebuilt from this same text by scripts/terms-pdf/build_terms_pdf.py,
 * so edit the wording here and rebuild the PDF together.
 */

export interface TermsSection {
  title: string;
  paragraphs: string[];
}

export const termsTitle = 'Terms, Privacy & Educational Platform Disclosures';

export const acceptanceHeading = '1. Acceptance of Terms and Privacy Policy: User Acknowledgment';
export const acceptanceIntro = 'By checking the acknowledgment boxes on the sign-up page, I acknowledge that:';
export const acceptanceStatement = 'I have read and agree to the Yield Guardian Terms & Conditions and acknowledge the Privacy Policy.';
export const acceptanceRetention = 'Yield Guardian will retain the applicable terms version, privacy-policy version, and acceptance date/time and you will not be asked to accept them again unless the applicable terms or privacy policy materially change.';

export const acknowledgments: string[] = [
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

export const sections: TermsSection[] = [
  {
    title: '2. Educational and Informational Platform',
    paragraphs: [
      'Yield Guardian is an educational and informational platform designed to help users explore and better understand investment portfolios, dividend income, dividend yield, diversification, portfolio history, and potential portfolio alternatives.',
      'Yield Guardian is not a broker-dealer, investment adviser, financial planner, tax adviser, or trading platform. Information, calculations, analyses, projections, comparisons, securities, strategies, and other content presented by Yield Guardian are provided for educational and informational purposes only and are not individualized investment, financial, legal, or tax advice.',
      'Nothing presented by Yield Guardian constitutes a recommendation, solicitation, instruction, or offer to buy, sell, hold, or trade any security. Users should choose to consult a qualified financial, investment, tax, legal, or other professional before making financial or investment decisions.',
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
      "Payment information needed to purchase paid Yield Guardian services may be processed by a third-party payment service provider and will be covered by that third-party payment service provider's privacy policies.",
      'Yield Guardian may retain portfolio information, user-reported transactions, analysis history, and related data as necessary to provide portfolio tracking, historical analysis, calculations, and reporting. This Privacy Policy may be updated to describe the actual storage, retention, security, deletion, and sharing practices implemented by the application.',
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
  {
    title: '13. Free Month and Subscriptions',
    paragraphs: [
      'Yield Guardian offers each person one free month: 30 days of full access to the platform\'s features, including the names and share counts of Alternatives, Instructions to Broker, Complete Transaction, and Compare against. The free month begins on the day it is first started, as a guest or on a Yield Guardian account, and ends 30 days later. A free month started as a guest carries over to the account the user later creates and does not restart.',
      'A guest may use the free month without creating an account, but a guest\'s portfolio is not saved. To save a portfolio, the user must create an account and accept these Terms and the Privacy Policy.',
      'No payment card is required for a free month started before February 1, 2027. A free month started on or after February 1, 2027 requires a payment card when it begins. Unless the subscription is canceled before the free month ends, the card will be charged the subscription price shown at checkout (currently $29.95 per month) when the free month ends, and each month after that until the subscription is canceled.',
      'A user whose free month was started without a card keeps the full free month. If that user subscribes during the free month, the first charge is made when the free month ends, not on the day of subscribing.',
      'During the last 3 days of the free month, Yield Guardian displays a notice in the app showing the date the free month ends.',
      'When the free month ends without a subscription, the names and share counts of Alternatives and the broker tools are hidden again until the user subscribes. Saved portfolios are kept and are not deleted.',
      'The free month is limited to one per person. Creating additional accounts or using additional email addresses to obtain additional free months is not permitted, and Yield Guardian may end any free month obtained this way.',
      'A subscription may be canceled at any time by contacting Yield Guardian at linda@guardianyield.com. Yield Guardian may change or end the free month offer for free months not yet started; a free month that has already begun will not be shortened.',
    ],
  },
];

export const disclosures: { label: string; text: string }[] = [
  { label: 'General footer:', text: 'For educational and informational purposes only. Yield Guardian does not provide investment advice or execute trades. Securities shown are alternatives for analysis, not recommendations.' },
  { label: 'Desired Yield:', text: 'Your Desired Yield is a target, not a guarantee. Market conditions, available securities, dividend changes, and portfolio constraints may prevent the selected yield from being achieved.' },
  { label: 'Dividend results:', text: 'Dividends are not guaranteed. Estimates are based on company-reported financial information and published dividend statements available at the time of analysis. Actual results may differ.' },
  { label: 'Alternative Strategy:', text: 'Illustrative analysis only. Alternatives are presented for comparison and are not recommendations to buy, sell, or hold a security. Prices, dividends, yields, and actual results may change.' },
  { label: 'Transaction / how-to:', text: 'Educational steps only. Yield Guardian may explain how an illustrated portfolio change could be made, but does not recommend, place, transmit, or execute trades. You decide whether to proceed and execute transactions independently through your brokerage.' },
  { label: 'Trade tracking:', text: 'Yield Guardian records transactions you report for portfolio tracking, history, calculations, and reporting. Recording a transaction in Yield Guardian does not execute or transmit a trade.' },
  { label: 'Portfolio privacy:', text: 'Yield Guardian does not require personally identifiable information to analyze a portfolio. Please do not include unnecessary personal identifying information in portfolio data submitted for analysis.' },
];

export const disclosuresTitle = '14. Short In-App Disclosures';

export const footerLines = [
  '© 2026 Linda L. Franklin, Mindi Briese, Annanesia Rankin and Michelle Evans. All Rights Reserved.',
  'Yield Guardian is a portfolio analysis tool, not a registered investment advisor. All information is for educational purposes only and should not be considered personalized financial, investment, tax, or legal advice.',
];
