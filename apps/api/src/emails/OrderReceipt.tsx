import React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Row,
  Column
} from '@react-email/components';

interface OrderReceiptEmailProps {
  order: {
    id: string;
    restaurantName?: string;
    tableId?: string;
    items: Array<{ name: string; quantity: number; unitPrice: number }>;
    totalAmount: number;
    createdAt?: string;
  };
}

export const OrderReceiptEmail = ({ order }: OrderReceiptEmailProps) => {
  const { id, restaurantName = "Order Pro", tableId, items, totalAmount } = order;
  const shortId = id.split("_")[1] || id;

  return (
    <Html>
      <Head />
      <Preview>Your receipt from {restaurantName} - Order #{shortId}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={restaurantTitle}>{restaurantName}</Heading>
            <Text style={receiptTitle}>Order Receipt</Text>
            <Text style={orderId}>#{shortId}</Text>
          </Section>

          <Hr style={hr} />

          <Section style={detailsSection}>
            {tableId && (
              <Text style={detailText}><strong>Table:</strong> {tableId}</Text>
            )}
            <Text style={detailText}><strong>Date:</strong> {new Date().toLocaleDateString()}</Text>
          </Section>

          <Section style={itemsSection}>
            {items.map((item, index) => (
              <Row key={index} style={itemRow}>
                <Column style={itemColName}>
                  <Text style={itemName}>{item.quantity}x {item.name}</Text>
                </Column>
                <Column style={itemColPrice}>
                  <Text style={itemPrice}>${(item.quantity * item.unitPrice).toFixed(2)}</Text>
                </Column>
              </Row>
            ))}
          </Section>

          <Hr style={hr} />

          <Section style={totalSection}>
            <Row>
              <Column>
                <Text style={totalLabel}>Total</Text>
              </Column>
              <Column style={itemColPrice}>
                <Text style={totalValue}>${totalAmount.toFixed(2)}</Text>
              </Column>
            </Row>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>Thank you for dining with us!</Text>
            <Text style={footerText}>Powered by Order Pro</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderReceiptEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  maxWidth: '600px',
};

const header = {
  textAlign: 'center' as const,
  marginBottom: '24px',
};

const restaurantTitle = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#1a1a1a',
  margin: '0 0 8px 0',
};

const receiptTitle = {
  fontSize: '18px',
  color: '#666666',
  margin: '0 0 4px 0',
};

const orderId = {
  fontSize: '14px',
  color: '#888888',
  margin: '0',
};

const detailsSection = {
  marginBottom: '24px',
};

const detailText = {
  fontSize: '14px',
  color: '#444444',
  margin: '4px 0',
};

const itemsSection = {
  marginBottom: '24px',
};

const itemRow = {
  width: '100%',
  marginBottom: '12px',
};

const itemColName = {
  width: '70%',
};

const itemColPrice = {
  width: '30%',
  textAlign: 'right' as const,
};

const itemName = {
  fontSize: '14px',
  color: '#1a1a1a',
  margin: '0',
};

const itemPrice = {
  fontSize: '14px',
  color: '#1a1a1a',
  margin: '0',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const totalSection = {
  marginBottom: '32px',
};

const totalLabel = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#1a1a1a',
  margin: '0',
};

const totalValue = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#f97316', // Orange primary color
  margin: '0',
};

const footer = {
  textAlign: 'center' as const,
};

const footerText = {
  fontSize: '12px',
  color: '#888888',
  margin: '4px 0',
};
