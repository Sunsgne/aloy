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
  Steps,
  Table,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";

const { Header, Sider, Content } = Layout;

const navItems = [
  { key: "overview", label: "总览" },
  { key: "devices", label: "设备清单" },
  { key: "onboarding", label: "设备初始化" },
  { key: "tenants", label: "租户管理" },
  { key: "users", label: "用户与角色" },
  { key: "subscription", label: "订阅与配额" },
  { key: "tokens", label: "API Token" },
  { key: "audit", label: "审计日志" },
];

const devices = [
  { key: "1", name: "SG-EDGE-01", site: "新加坡核心站点", model: "CCR2004-1G-12S+2XS", version: "7.19.1", address: "10.70.0.11", status: "ONLINE" },
  { key: "2", name: "SG-BRANCH-03", site: "滨海湾门店", model: "RB5009UG+S+", version: "7.18.2", address: "10.70.3.21", status: "ONLINE" },
  { key: "3", name: "HK-POP-01", site: "香港 POP", model: "CCR2116-12G-4S+", version: "7.19.1", address: "10.70.10.10", status: "ONBOARDING" },
  { key: "4", name: "TYO-BRANCH-02", site: "东京办公室", model: "RB4011iGS+", version: "7.17.2", address: "10.70.22.14", status: "OFFLINE" },
];

const onboardingSessions = [
  { key: "1", device: "HK-POP-01", site: "香港 POP", mode: "POP_NODE", step: 3, progress: 52, status: "RUNNING" },
  { key: "2", device: "SG-BRANCH-03", site: "滨海湾门店", mode: "CLEAN_BOOTSTRAP", step: 8, progress: 100, status: "SUCCEEDED" },
  { key: "3", device: "TYO-BRANCH-02", site: "东京办公室", mode: "ADOPT_EXISTING", step: 2, progress: 36, status: "PENDING" },
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
  const color = ["ACTIVE", "ONLINE", "SUCCEEDED"].includes(status) ? "green" :
    ["EXPIRING", "ONBOARDING", "RUNNING", "PENDING"].includes(status) ? "gold" : "red";
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

function Devices() {
  return (
    <>
      <div className="hero-header device-hero">
        <div>
          <Tag color="cyan">RouterOS Fleet</Tag>
          <Typography.Title level={2}>设备清单</Typography.Title>
          <Typography.Text>掌握每台 RouterOS 设备的接入状态、版本和管理地址。</Typography.Text>
        </div>
        <Space><Button>批量导入</Button><Button type="primary">添加设备</Button></Space>
      </div>
      <Row gutter={[16, 16]} className="fleet-metrics">
        {[["设备总数", "318", "覆盖 42 个站点"], ["在线率", "98.7%", "过去 30 天"], ["待初始化", "6", "3 个正在执行"], ["版本合规", "94.2%", "18 台需要升级"]].map(([label, value, detail]) => (
          <Col xs={24} sm={12} xl={6} key={label}>
            <div className="metric-tile"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
          </Col>
        ))}
      </Row>
      <Card className="fleet-card" title="RouterOS 设备" extra={<Space><Tag>所有站点</Tag><Tag>所有状态</Tag></Space>}>
        <Table dataSource={devices} pagination={false} columns={[
          { title: "设备", dataIndex: "name", render: (value) => <div className="device-name"><span className="device-glyph">R</span><strong>{value}</strong></div> },
          { title: "站点", dataIndex: "site" },
          { title: "型号", dataIndex: "model" },
          { title: "RouterOS", dataIndex: "version", render: (value) => <Typography.Text code>{value}</Typography.Text> },
          { title: "管理地址", dataIndex: "address", render: (value) => <Typography.Text className="mono">{value}</Typography.Text> },
          { title: "状态", dataIndex: "status", render: (value) => <StatusTag status={value} /> },
          { title: "", render: () => <Button type="link">查看设备</Button> },
        ]} />
      </Card>
    </>
  );
}

function Onboarding() {
  const modeCards = [
    ["CLEAN_BOOTSTRAP", "全新接入", "为新设备建立管理隧道、身份、监控与基础配置。", "blue"],
    ["ADOPT_EXISTING", "接管现网", "先只读分析配置，生成冲突报告后确定接管范围。", "purple"],
    ["MONITORING_ONLY", "仅监控", "只配置管理访问与可观测性，不修改业务配置。", "green"],
    ["POP_NODE", "POP 节点", "初始化 VRF、路由、DNS 与容量策略。", "gold"],
  ];
  return (
    <>
      <div className="hero-header onboarding-hero">
        <div>
          <Tag color="purple">Guided Onboarding</Tag>
          <Typography.Title level={2}>RouterOS 初始化中心</Typography.Title>
          <Typography.Text>以可审计、可回滚的工作流安全接入设备。</Typography.Text>
        </div>
        <Button type="primary">开始初始化</Button>
      </div>
      <Row gutter={[16, 16]}>
        {modeCards.map(([key, title, detail, tone]) => (
          <Col xs={24} md={12} xl={6} key={key}>
            <Card className={`mode-card ${tone}`}>
              <span className="mode-index">0{modeCards.findIndex((item) => item[0] === key) + 1}</span>
              <Typography.Title level={4}>{title}</Typography.Title>
              <Typography.Paragraph type="secondary">{detail}</Typography.Paragraph>
              <Typography.Text code>{key}</Typography.Text>
            </Card>
          </Col>
        ))}
      </Row>
      <Row gutter={[18, 18]} className="content-row">
        <Col xs={24} xl={16}>
          <Card title="初始化会话" extra={<Button type="link">查看历史</Button>}>
            <Table dataSource={onboardingSessions} pagination={false} columns={[
              { title: "设备", dataIndex: "device", render: (value, row) => <div><strong>{value}</strong><small className="block-muted">{row.site}</small></div> },
              { title: "模式", dataIndex: "mode", render: (value) => <Typography.Text code>{value}</Typography.Text> },
              { title: "进度", dataIndex: "progress", render: (value) => <Progress percent={value} size="small" /> },
              { title: "状态", dataIndex: "status", render: (value) => <StatusTag status={value} /> },
            ]} />
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card title="当前执行">
            <div className="current-device"><span className="device-glyph large">R</span><div><strong>HK-POP-01</strong><small>POP_NODE · 香港 POP</small></div></div>
            <Steps direction="vertical" size="small" current={2} items={[
              { title: "连接平台" }, { title: "配置管理网络" }, { title: "配置租户 VRF" }, { title: "配置动态路由" }, { title: "验证 POP 节点" },
            ]} />
          </Card>
        </Col>
      </Row>
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
    section === "devices" ? <Devices /> : section === "onboarding" ? <Onboarding /> :
    section === "users" ? <Users /> : section === "subscription" ? <Subscription /> :
      section === "tokens" ? <Tokens /> : <Audit />;

  return (
    <Layout className="app-shell">
      <Sider width={260} className="sidebar">
        <div className="brand"><span className="brand-mark">A</span><span>Aloy</span></div>
        <div className="workspace"><Typography.Text type="secondary">当前工作区</Typography.Text><strong>Aloy Labs</strong></div>
        <Menu mode="inline" selectedKeys={[section]} items={navItems} onClick={({ key }) => setSection(key)} />
        <div className="sidebar-footer"><Badge status="success" /><span>所有服务正常</span></div>
      </Sider>
      <Layout>
        <Header className="topbar">
          <Tag color="blue">Milestone 3 · Device Foundation</Tag>
          <Space><div className="identity"><strong>Lin Chen</strong><Typography.Text type="secondary">Platform Admin</Typography.Text></div><Avatar>LC</Avatar></Space>
        </Header>
        <Content className="page-content">{content}</Content>
      </Layout>
    </Layout>
  );
}
