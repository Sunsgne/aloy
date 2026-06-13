"use client";

import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Layout,
  Menu,
  Progress,
  Row,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";

const { Header, Sider, Content } = Layout;

const navItems = [
  { key: "overview", label: "总览" },
  { key: "tenants", label: "租户管理" },
  { key: "users", label: "用户与角色" },
  { key: "subscription", label: "订阅与配额" },
  { key: "tokens", label: "API Token" },
  { key: "audit", label: "审计日志" },
];

const stats = [
  { label: "活跃租户", value: "12", detail: "较上月 +2", tone: "blue" },
  { label: "在线用户", value: "86", detail: "过去 24 小时", tone: "green" },
  { label: "API Token", value: "18", detail: "2 个即将到期", tone: "gold" },
  { label: "审计事件", value: "1,284", detail: "过去 7 天", tone: "purple" },
];

const tenants = [
  { key: "1", name: "Aloy Labs", slug: "aloy-labs", plan: "Enterprise", users: 24, status: "ACTIVE" },
  { key: "2", name: "Northwind Networks", slug: "northwind", plan: "Professional", users: 18, status: "ACTIVE" },
  { key: "3", name: "Orchid Retail", slug: "orchid-retail", plan: "Professional", users: 11, status: "ACTIVE" },
  { key: "4", name: "Demo Workspace", slug: "demo", plan: "Starter", users: 5, status: "DISABLED" },
];

const users = [
  { key: "1", name: "Lin Chen", email: "lin@aloy.dev", role: "Tenant Admin", status: "ACTIVE" },
  { key: "2", name: "Maya Singh", email: "maya@aloy.dev", role: "Network Operator", status: "ACTIVE" },
  { key: "3", name: "Alex Wu", email: "alex@aloy.dev", role: "Auditor", status: "ACTIVE" },
  { key: "4", name: "Jamie Lee", email: "jamie@aloy.dev", role: "Network Operator", status: "LOCKED" },
];

const tokens = [
  { key: "1", name: "Automation Worker", created: "2026-06-12", expires: "2026-12-12", status: "ACTIVE" },
  { key: "2", name: "Terraform Provider", created: "2026-05-24", expires: "永不过期", status: "ACTIVE" },
  { key: "3", name: "Legacy Integration", created: "2026-01-10", expires: "2026-06-20", status: "EXPIRING" },
];

const audit = [
  { key: "1", action: "api-token.create", actor: "Lin Chen", resource: "Automation Worker", time: "2 分钟前" },
  { key: "2", action: "role.update", actor: "Lin Chen", resource: "Network Operator", time: "18 分钟前" },
  { key: "3", action: "user.update", actor: "Maya Singh", resource: "Jamie Lee", time: "1 小时前" },
  { key: "4", action: "subscription.create", actor: "Platform Admin", resource: "Aloy Labs", time: "昨天" },
];

function StatusTag({ status }: { status: string }) {
  const color = status === "ACTIVE" ? "green" : status === "EXPIRING" ? "gold" : "red";
  return <Tag color={color}>{status}</Tag>;
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: string }) {
  return (
    <div className="section-header">
      <div>
        <Typography.Title level={2}>{title}</Typography.Title>
        <Typography.Text type="secondary">{subtitle}</Typography.Text>
      </div>
      {action && <Button type="primary">{action}</Button>}
    </div>
  );
}

function Overview() {
  return (
    <>
      <SectionHeader title="早上好，Lin" subtitle="这里是 Aloy 平台今天的运行情况。" action="创建租户" />
      <Row gutter={[18, 18]}>
        {stats.map((stat) => (
          <Col xs={24} sm={12} xl={6} key={stat.label}>
            <Card className="stat-card">
              <div className={`stat-dot ${stat.tone}`} />
              <Typography.Text type="secondary">{stat.label}</Typography.Text>
              <Typography.Title level={2}>{stat.value}</Typography.Title>
              <Typography.Text type="secondary">{stat.detail}</Typography.Text>
            </Card>
          </Col>
        ))}
      </Row>
      <Row gutter={[18, 18]} className="content-row">
        <Col xs={24} xl={15}>
          <Card title="租户概览" extra={<Button type="link">查看全部</Button>}>
            <Table
              dataSource={tenants.slice(0, 3)}
              pagination={false}
              columns={[
                { title: "租户", dataIndex: "name" },
                { title: "套餐", dataIndex: "plan", render: (value) => <Tag>{value}</Tag> },
                { title: "用户", dataIndex: "users" },
                { title: "状态", dataIndex: "status", render: (value) => <StatusTag status={value} /> },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={9}>
          <Card title="服务状态">
            {["API", "Worker", "Trap Receiver", "Probe Ingest"].map((service) => (
              <div className="service-row" key={service}>
                <Space><Badge status="success" />{service}</Space>
                <Typography.Text type="secondary">正常</Typography.Text>
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </>
  );
}

function Tenants() {
  return (
    <>
      <SectionHeader title="租户管理" subtitle="集中管理平台租户、状态和订阅计划。" action="创建租户" />
      <Card>
        <Table dataSource={tenants} columns={[
          { title: "租户名称", dataIndex: "name" },
          { title: "标识", dataIndex: "slug", render: (value) => <Typography.Text code>{value}</Typography.Text> },
          { title: "套餐", dataIndex: "plan" },
          { title: "用户数", dataIndex: "users" },
          { title: "状态", dataIndex: "status", render: (value) => <StatusTag status={value} /> },
          { title: "", render: () => <Button type="link">管理</Button> },
        ]} />
      </Card>
    </>
  );
}

function Users() {
  return (
    <>
      <SectionHeader title="用户与角色" subtitle="管理当前租户成员和基于权限的角色。" action="邀请用户" />
      <Row gutter={[18, 18]}>
        <Col xs={24} xl={16}>
          <Card title="用户">
            <Table dataSource={users} pagination={false} columns={[
              { title: "姓名", dataIndex: "name" },
              { title: "邮箱", dataIndex: "email" },
              { title: "角色", dataIndex: "role", render: (value) => <Tag>{value}</Tag> },
              { title: "状态", dataIndex: "status", render: (value) => <StatusTag status={value} /> },
            ]} />
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card title="角色">
            {["Tenant Admin", "Network Operator", "Auditor"].map((role, index) => (
              <div className="role-row" key={role}>
                <Avatar>{role[0]}</Avatar>
                <div><strong>{role}</strong><Typography.Text type="secondary">{[14, 8, 3][index]} 项权限</Typography.Text></div>
                <Button type="link">编辑</Button>
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </>
  );
}

function Subscription() {
  return (
    <>
      <SectionHeader title="订阅与配额" subtitle="查看当前租户计划和资源使用情况。" action="调整套餐" />
      <Card className="plan-card">
        <Tag color="blue">ENTERPRISE</Tag>
        <Typography.Title level={2}>Aloy Enterprise</Typography.Title>
        <Typography.Paragraph type="secondary">面向大规模网络和高级自动化的完整能力。</Typography.Paragraph>
        <Row gutter={[24, 24]}>
          {[["站点", 42, 100], ["设备", 318, 1000], ["带宽", 2600, 10000], ["DNS 节点", 6, 20]].map(([label, used, limit]) => (
            <Col xs={24} md={12} key={label}>
              <div className="quota-label"><strong>{label}</strong><span>{used} / {limit}</span></div>
              <Progress percent={Math.round(Number(used) / Number(limit) * 100)} showInfo={false} />
            </Col>
          ))}
        </Row>
      </Card>
    </>
  );
}

function Tokens() {
  return (
    <>
      <SectionHeader title="API Token" subtitle="为自动化和外部集成创建安全凭据。" action="创建 Token" />
      <Card>
        <Table dataSource={tokens} pagination={false} columns={[
          { title: "名称", dataIndex: "name" },
          { title: "创建日期", dataIndex: "created" },
          { title: "到期日期", dataIndex: "expires" },
          { title: "状态", dataIndex: "status", render: (value) => <StatusTag status={value} /> },
          { title: "", render: () => <Button danger type="link">撤销</Button> },
        ]} />
      </Card>
    </>
  );
}

function Audit() {
  return (
    <>
      <SectionHeader title="审计日志" subtitle="追踪租户内所有敏感操作和权限变更。" action="导出日志" />
      <Card>
        <Table dataSource={audit} pagination={false} columns={[
          { title: "操作", dataIndex: "action", render: (value) => <Typography.Text code>{value}</Typography.Text> },
          { title: "操作者", dataIndex: "actor" },
          { title: "资源", dataIndex: "resource" },
          { title: "时间", dataIndex: "time" },
        ]} />
      </Card>
    </>
  );
}

export default function Home() {
  const [section, setSection] = useState("overview");
  const content = section === "overview" ? <Overview /> : section === "tenants" ? <Tenants /> :
    section === "users" ? <Users /> : section === "subscription" ? <Subscription /> :
      section === "tokens" ? <Tokens /> : <Audit />;

  return (
    <Layout className="app-shell">
      <Sider width={238} className="sidebar">
        <div className="brand"><span className="brand-mark">A</span><span>Aloy</span></div>
        <div className="workspace"><Typography.Text type="secondary">当前工作区</Typography.Text><strong>Aloy Labs</strong></div>
        <Menu mode="inline" selectedKeys={[section]} items={navItems} onClick={({ key }) => setSection(key)} />
        <div className="sidebar-footer"><Badge status="success" /><span>所有服务正常</span></div>
      </Sider>
      <Layout>
        <Header className="topbar">
          <Tag color="blue">Milestone 2</Tag>
          <Space><div className="identity"><strong>Lin Chen</strong><Typography.Text type="secondary">Platform Admin</Typography.Text></div><Avatar>LC</Avatar></Space>
        </Header>
        <Content className="page-content">{content}</Content>
      </Layout>
    </Layout>
  );
}
