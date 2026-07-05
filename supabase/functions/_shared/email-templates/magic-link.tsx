/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Sign in to {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={card}>
          <Text style={brand}>Yield Guardian</Text>
          <Heading style={h1}>Your sign-in link</Heading>
          <Text style={text}>
            Click below to sign in to {siteName}. This link expires shortly for your security.
          </Text>
          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button style={button} href={confirmationUrl}>Sign in</Button>
          </Section>
          <Text style={text}>
            Or paste this link into your browser:
            <br />
            <Link href={confirmationUrl} style={linkSmall}>{confirmationUrl}</Link>
          </Text>
          <Hr style={hr} />
          <Text style={footer}>Didn't request this link? You can safely ignore this email.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', -apple-system, Segoe UI, Arial, sans-serif" }
const container = { padding: '32px 16px', maxWidth: '560px' }
const card = { backgroundColor: '#0B1220', borderRadius: '12px', padding: '32px 28px', border: '1px solid #1a2436' }
const brand = { color: '#24E4B0', fontSize: '13px', fontWeight: 700 as const, letterSpacing: '1px', textTransform: 'uppercase' as const, margin: '0 0 20px' }
const h1 = { fontSize: '24px', fontWeight: 700 as const, color: '#F0F5FA', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#B4C0D3', lineHeight: '1.6', margin: '0 0 16px' }
const linkSmall = { color: '#24E4B0', textDecoration: 'underline', fontSize: '12px', wordBreak: 'break-all' as const }
const button = { backgroundColor: '#24E4B0', color: '#0B1220', fontSize: '15px', fontWeight: 600 as const, borderRadius: '10px', padding: '13px 28px', textDecoration: 'none', display: 'inline-block' }
const hr = { borderColor: '#1a2436', margin: '28px 0 20px' }
const footer = { fontSize: '12px', color: '#6B7A94', margin: 0, lineHeight: '1.5' }
