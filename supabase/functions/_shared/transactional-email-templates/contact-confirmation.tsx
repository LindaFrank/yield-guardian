/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  message?: string
}

const ContactConfirmationEmail = ({ name, message }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>We received your message — Yield Guardian</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={card}>
          <Text style={brand}>Yield Guardian</Text>
          <Heading style={h1}>We got your message</Heading>
          <Text style={text}>
            {name ? `Hi ${name},` : 'Hi there,'} thanks for reaching out. A member of our team
            will get back to you shortly.
          </Text>
          {message ? (
            <>
              <Text style={label}>Your message</Text>
              <Text style={quote}>{message}</Text>
            </>
          ) : null}
          <Hr style={hr} />
          <Text style={footer}>
            You're receiving this because you submitted the contact form at guardianyield.com.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactConfirmationEmail,
  subject: 'We received your message',
  displayName: 'Contact form confirmation',
  previewData: { name: 'Susan', message: 'How does the replacement engine pick suggestions?' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', -apple-system, Segoe UI, Arial, sans-serif" }
const container = { padding: '32px 16px', maxWidth: '560px' }
const card = { backgroundColor: '#0B1220', borderRadius: '12px', padding: '32px 28px', border: '1px solid #1a2436' }
const brand = { color: '#24E4B0', fontSize: '13px', fontWeight: 700 as const, letterSpacing: '1px', textTransform: 'uppercase' as const, margin: '0 0 20px' }
const h1 = { fontSize: '24px', fontWeight: 700 as const, color: '#F0F5FA', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#B4C0D3', lineHeight: '1.6', margin: '0 0 16px' }
const label = { fontSize: '12px', color: '#6B7A94', textTransform: 'uppercase' as const, letterSpacing: '1px', margin: '20px 0 6px' }
const quote = { fontSize: '14px', color: '#F0F5FA', background: '#0f1a2c', borderRadius: '10px', padding: '14px 16px', lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap' as const }
const hr = { borderColor: '#1a2436', margin: '28px 0 20px' }
const footer = { fontSize: '12px', color: '#6B7A94', margin: 0, lineHeight: '1.5' }
