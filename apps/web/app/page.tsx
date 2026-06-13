"use client";

import { Card, Col, Row, Tag, Typography } from "antd";

const services = [
  ["API", "http://localhost:3001/health"],
  ["Worker", "http://localhost:3011/health"],
  ["Trap Receiver", "http://localhost:3012/health"],
  ["Probe Ingest", "http://localhost:3013/health"],
] as const;

export default function Home() {
  return (
    <main>
      <Tag color="blue">Milestone 1</Tag>
      <Typography.Title>Aloy RouterOS SD-WAN</Typography.Title>
      <Typography.Paragraph>
        多租户 SD-WAN、智能 DNS、设备管理和统一监控平台。
      </Typography.Paragraph>
      <Row gutter={[16, 16]}>
        {services.map(([name, healthUrl]) => (
          <Col xs={24} md={12} key={name}>
            <Card title={name}>
              <Typography.Text code>{healthUrl}</Typography.Text>
            </Card>
          </Col>
        ))}
      </Row>
    </main>
  );
}
