/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteName, siteUrl, confirmationUrl }: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You're invited to {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={card}>
          <Text style={brand}>Yield Guardian</Text>
          <Heading style={h1}>You're invited</Heading>
          <Text style={text}>
            You've been invited to join <Link href={siteUrl} style={link}>{siteName}</Link>.
            Accept below to set up your account and start tracking dividend income.
          </Text>
          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button style={button} href={confirmationUrl}>Accept invitation</Button>
          </Section>
          <Text style={text}>
            Or paste this link into your browser:
            <br />
            <Link href={confirmationUrl} style={linkSmall}>{confirmationUrl}</Link>
          </Text>
          <Hr style={hr} />
          <Text style={footer}>Not expecting this? You can safely ignore this email.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', -apple-system, Segoe UI, Arial, sans-serif" }
const container = { padding: '32px 16px', maxWidth: '560px' }
const card = { backgroundColor: '#0B1220', borderRadius: '12px', padding: '32px 28px', border: '1px solid #1a2436' }
const brand = { color: '#24E4B0', fontSize: '13px', fontWeight: 700 as const, letterSpacing: '1px', textTransform: 'uppercase' as const, margin: '0 0 20px' }
const h1 = { fontSize: '24px', fontWeight: 700 as const, color: '#F0F5FA', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#B4C0D3', lineHeight: '1.6', margin: '0 0 16px' }
const link = { color: '#24E4B0', textDecoration: 'none' }
const linkSmall = { color: '#24E4B0', textDecoration: 'underline', fontSize: '12px', wordBreak: 'break-all' as const }
const button = { backgroundColor: '#24E4B0', color: '#0B1220', fontSize: '15px', fontWeight: 600 as const, borderRadius: '10px', padding: '13px 28px', textDecoration: 'none', display: 'inline-block' }
const hr = { borderColor: '#1a2436', margin: '28px 0 20px' }
const footer = { fontSize: '12px', color: '#6B7A94', margin: 0, lineHeight: '1.5' }
