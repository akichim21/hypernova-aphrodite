import React from 'react';
import ReactDOM from 'react-dom';
import ReactDOMServer from 'react-dom/server';
import hypernova, { serialize, load, toScript, fromScript } from 'hypernova';
import { StyleSheet, StyleSheetServer } from 'aphrodite';

export const renderReactWithAphrodite = (name, component) => hypernova({
  server() {
    return (props) => {
      const { html, css } = StyleSheetServer.renderStatic(() => (
        ReactDOMServer.renderToString(React.createElement(component, props))
      ));

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
          const element = React.createElement(component, data);
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

export const renderReactWithAphroditeStatic = (name, component) => hypernova({
  server() {
    return (props) => {
      const { html, css } = StyleSheetServer.renderStatic(() => (
        ReactDOMServer.renderToStaticMarkup(React.createElement(component, props))
      ));

      const style = `<style data-aphrodite="data-aphrodite">${css.content}</style>`;

      return `${style}\n${html}`;
    };
  },

  client() {},
});
