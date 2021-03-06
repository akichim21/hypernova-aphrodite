import React from 'react';
import ReactDOM from 'react-dom';
import ReactDOMServer from 'react-dom/server';
import hypernova, { serialize, load, toScript, fromScript } from 'hypernova';
import { StyleSheet, StyleSheetServer } from 'aphrodite';

const config = {
  enhancers: [], // HOCs applied to the component before render: e0(e1(e2(...en(component))))
};

export const setRenderEnhancers = (...enhancers) => {
  // Check that all enhancers are functions
  enhancers.forEach((enhancer, index) => {
    if (typeof enhancer !== 'function') {
      throw new TypeError(`enhancers passed to setRenderEnhancer should be functions: ${index}`);
    }
  });

  config.enhancers = enhancers; // clear & set
};

const enhance = component => config.enhancers.reduceRight((x, f) => f(x), component);

export const renderReactWithAphrodite = (name, component) => {
  const enhancedComponent = enhance(component);
  return hypernova({
    server() {
      return (props) => {
        const { html, css } = StyleSheetServer.renderStatic(() => {
          const element = React.createElement(enhancedComponent, props);
          return ReactDOMServer.renderToString(element);
        });

        const style = `<style data-aphrodite="data-aphrodite">${css.content}</style>`;
        const markup = serialize(name, html, props);
        const classNames = toScript({ 'aphrodite-css': name }, css.renderedClassNames);

        return `${style}\n${markup}\n${classNames}`;
      };
    },

    client() {
      const classNames = fromScript({ 'aphrodite-css': name });
      if (classNames) StyleSheet.rehydrate(classNames);

      const payloads = load(name);
      if (payloads) {
        payloads.forEach((payload) => {
          const { node, data } = payload;
          if (node) {
            const element = React.createElement(enhancedComponent, data);
            if (ReactDOM.hydrate) {
              ReactDOM.hydrate(element, node);
            } else {
              ReactDOM.render(element, node);
            }
          }
        });
      }

      return component;
    },
  });
};

export const renderReactWithAphroditeStatic = (name, component) => {
  const enhancedComponent = enhance(component);
  return hypernova({
    server() {
      return (props) => {
        const { html, css } = StyleSheetServer.renderStatic(() => {
          const element = React.createElement(enhancedComponent, props);
          return ReactDOMServer.renderToStaticMarkup(element);
        });

        const style = `<style data-aphrodite="data-aphrodite">${css.content}</style>`;

        return `${style}\n${html}`;
      };
    },

    client() {},
  });
};
