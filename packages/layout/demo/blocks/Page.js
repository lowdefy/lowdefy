import React from 'react';
import { Layout, Breadcrumb } from 'antd';

const { Header, Content, Footer, Sider } = Layout;

class Page extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapsed: false,
    };
    this.onCollapse = this.onCollapse.bind(this);
  }

  onCollapse(collapsed) {
    console.log(collapsed);
    this.setState({ collapsed });
  }

  render() {
    const { content } = this.props;
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Sider collapsible collapsed={this.state.collapsed} onCollapse={this.onCollapse}>
          <div className="logo" />
          {content.sider && content.sider()}
        </Sider>
        <Layout className="site-layout">
          <Header className="site-layout-background" style={{ padding: 0 }}>
            {content.header && content.header()}
          </Header>
          <Content style={{ margin: '0 16px' }}>
            <Breadcrumb style={{ margin: '16px 0' }}>
              <Breadcrumb.Item>User</Breadcrumb.Item>
              <Breadcrumb.Item>Bill</Breadcrumb.Item>
            </Breadcrumb>
            <div className="site-layout-background" style={{ padding: 24, minHeight: 360 }}>
              {content.content && content.content()}
            </div>
          </Content>
          {content.footer && (
            <Footer style={{ textAlign: 'center' }}>{content.footer && content.footer()}</Footer>
          )}
        </Layout>
      </Layout>
    );
  }
}

export default Page;
