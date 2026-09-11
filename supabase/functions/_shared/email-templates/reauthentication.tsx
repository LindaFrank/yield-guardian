/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps { token: string }

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Yield Guardian verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={card}>
          <Text style={brand}>Yield Guardian</Text>
          <Heading style={h1}>Confirm it's you</Heading>
          <Text style={text}>Use this code to confirm your identity:</Text>
          <Text style={codeStyle}>{token}</Text>
          <Hr style={hr} />
          <Text style={footer}>
            This code expires shortly. Didn't request it? You can safely ignore this email.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', -apple-system, Segoe UI, Arial, sans-serif" }
const container = { padding: '32px 16px', maxWidth: '560px' }
const card = { backgroundColor: '#0B1220', borderRadius: '12px', padding: '32px 28px', border: '1px solid #1a2436' }
const brand = { color: '#24E4B0', fontSize: '13px', fontWeight: 700 as const, letterSpacing: '1px', textTransform: 'uppercase' as const, margin: '0 0 20px' }
const h1 = { fontSize: '24px', fontWeight: 700 as const, color: '#F0F5FA', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#B4C0D3', lineHeight: '1.6', margin: '0 0 16px' }
const codeStyle = {
  fontFamily: "'JetBrains Mono', Menlo, Courier, monospace",
  fontSize: '28px', fontWeight: 700 as const, color: '#24E4B0',
  letterSpacing: '6px', textAlign: 'center' as const,
  background: '#0f1a2c', padding: '16px', borderRadius: '10px',
  margin: '20px 0 8px',
}
const hr = { borderColor: '#1a2436', margin: '28px 0 20px' }
const footer = { fontSize: '12px', color: '#6B7A94', margin: 0, lineHeight: '1.5' }
