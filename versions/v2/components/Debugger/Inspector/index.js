import React from 'react';
import {Decorator as Cerebral} from 'cerebral-view-react';
import styles from './styles.css';
import {
  isObject,
  isArray,
  isString,
  isBoolean,
  isNumber,
  isNull
} from 'common/utils';
import JSONInput from './JSONInput';
import connector from 'connector';

function isInPath(source, target) {
  return target.reduce((isInPath, key, index) => {
    if (!isInPath) {
      return false;
    }
    return String(source[index]) === String(key);
  }, true);
}

function renderType(value, hasNext, path, propertyKey, highlightPath) {
  if (value === undefined) {
    return null;
  }

  if (isArray(value)) {
    return (
      <ArrayValue
        value={value}
        hasNext={hasNext}
        path={path}
        propertyKey={propertyKey}
        highlightPath={highlightPath}/>
    );
  }
  if (isObject(value)) {
    return (
      <ObjectValue
        value={value}
        hasNext={hasNext}
        path={path}
        propertyKey={propertyKey}
        highlightPath={highlightPath}/>
    );
  }

  return (
    <Value
      value={value}
      hasNext={hasNext}
      path={path}
      propertyKey={propertyKey}
      highlightPath={highlightPath}/>
  );

}

class ObjectValue extends React.Component {
  static contextTypes = {
    options: React.PropTypes.object.isRequired
  }
  constructor(props, context) {
    super(props);
    const numberOfKeys = Object.keys(props.value).length;
    const isHighlightPath = this.props.highlightPath && isInPath(this.props.highlightPath, this.props.path);

    this.state = {
      isCollapsed: !isHighlightPath && (numberOfKeys > 3 || numberOfKeys === 0) ? true : context.options.expanded ? false : true
    };
  }
  renderProperty(key, value, index, hasNext, path) {
    this.props.path.push(key);
    const property = (
      <div className={styles.objectProperty} key={index}>
        <div className={styles.objectPropertyValue}>{renderType(value, hasNext, path.slice(), key, this.props.highlightPath)}</div>
      </div>
    );
    this.props.path.pop();
    return property;
  }
  renderKeys(keys) {
    if (keys.length > 3) {
      return keys.slice(0, 3).join(', ') + '...'
    }
    return keys.join(', ');
  }
  render() {
    const {value, hasNext} = this.props;
    const isExactHighlightPath = this.props.highlightPath && String(this.props.highlightPath) === String(this.props.path);

    if (this.state.isCollapsed) {
      return (
        <div className={isExactHighlightPath ? styles.highlightObject : styles.object} onClick={() => this.setState({isCollapsed: false})}>
          {this.props.propertyKey ? this.props.propertyKey + ': ' : null}
          <strong>{'{ '}</strong>{this.renderKeys(Object.keys(value))}<strong>{' }'}</strong>
          {hasNext ? ',' : null}
        </div>
      );
    } else if (this.props.propertyKey) {
      const keys = Object.keys(value);
      return (
        <div className={isExactHighlightPath ? styles.highlightObject : styles.object}>
          <div onClick={() => this.setState({isCollapsed: true})}>{this.props.propertyKey}: <strong>{'{ '}</strong></div>
          {keys.map((key, index) => this.renderProperty(key, value[key], index, index < keys.length - 1, this.props.path))}
          <div><strong>{' }'}</strong>{hasNext ? ',' : null}</div>
        </div>
      );
    } else {
      const keys = Object.keys(value);
      return (
        <div className={isExactHighlightPath ? styles.highlightObject : styles.object}>
          <div onClick={() => this.setState({isCollapsed: true})}><strong>{'{ '}</strong></div>
          {keys.map((key, index) => this.renderProperty(key, value[key], index, index < keys.length - 1, this.props.path, this.props.highlightPath))}
          <div><strong>{' }'}</strong>{hasNext ? ',' : null}</div>
        </div>
      );
    }
  }
}

class ArrayValue extends React.Component {
  static contextTypes = {
    options: React.PropTypes.object.isRequired
  }
  constructor(props, context) {
    super(props);
    const numberOfItems = props.value.length;
    const isHighlightPath = this.props.highlightPath && isInPath(this.props.highlightPath, this.props.path);
    this.state = {
      isCollapsed: !isHighlightPath && (numberOfItems > 3 || numberOfItems === 0) ? true : context.options.expanded ? false : true
    };
  }
  renderItem(item, index, hasNext, path) {
    this.props.path.push(index);
    const arrayItem = (
      <div className={styles.arrayItem} key={index}>
        {renderType(item, hasNext, path.slice())}
      </div>
    );
    this.props.path.pop();
    return arrayItem;
  }
  render() {
    const {value, hasNext} = this.props;
    const isExactHighlightPath = this.props.highlightPath && String(this.props.highlightPath) === String(this.props.path);

    if (this.state.isCollapsed) {
      return (
        <div className={isExactHighlightPath ? styles.highlightArray : styles.array} onClick={() => this.setState({isCollapsed: false})}>
          {this.props.propertyKey ? this.props.propertyKey + ': ' : null}
          <strong>{'[ '}</strong>{value.length}<strong>{' ]'}</strong>
          {hasNext ? ',' : null}
        </div>
      );
    } else if (this.props.propertyKey) {
      const keys = Object.keys(value);
      return (
        <div className={isExactHighlightPath ? styles.highlightArray : styles.array}>
          <div onClick={() => this.setState({isCollapsed: true})}>{this.props.propertyKey}: <strong>{'[ '}</strong></div>
          {value.map((item, index) => this.renderItem(item, index, index < value.length - 1, this.props.path))}
          <div><strong>{' ]'}</strong>{hasNext ? ',' : null}</div>
        </div>
      );
    } else {
      return (
        <div className={isExactHighlightPath ? styles.highlightArray : styles.array}>
          <div onClick={() => this.setState({isCollapsed: true})}><strong>{'[ '}</strong></div>
          {value.map((item, index) => this.renderItem(item, index, index < value.length - 1, this.props.path))}
          <div><strong>{' ]'}</strong>{hasNext ? ',' : null}</div>
        </div>
      );
    }
  }
}

@Cerebral()
class Value extends React.Component {
  static contextTypes = {
    options: React.PropTypes.object.isRequired
  }
  constructor(props) {
    super(props);
    this.state = {
      isEditing: false,
      path: props.path.slice()
    };
  }
  onClick() {
    this.setState({
      isEditing: this.context.options.canEdit ? true : false
    });
  }
  onSubmit(value) {
    this.props.signals.debugger.modelChanged({
      path: this.state.path,
      value
    })
    this.setState({isEditing: false});
    connector.sendEvent('changeModel', {
      path: this.state.path,
      value: value
    });
  }
  renderValue(value, hasNext) {
    const isExactHighlightPath = this.props.highlightPath && String(this.props.highlightPath) === String(this.props.path);

    if (this.state.isEditing) {
      return (
        <div className={isExactHighlightPath ? styles.highlightValue : null}>
          {this.props.propertyKey ? this.props.propertyKey + ': ' : <span/>}
          <span>
            <JSONInput
              value={value}
            onBlur={() => this.setState({isEditing: false})}
            onSubmit={(value) => this.onSubmit(value)}/>
          </span>
            {hasNext ? ',' : null}
        </div>
        );
    } else {
      return (
        <div className={isExactHighlightPath ? styles.highlightValue : null}>
          {this.props.propertyKey ? this.props.propertyKey + ': ' : <span/>}
          <span>{isString(value) ? '"' + value + '"' : String(value)}</span>
          {hasNext ? ',' : null}
        </div>
      );
    }
  }
  render() {
    let className = styles.string;
    if (isNumber(this.props.value)) className = styles.number;
    if (isBoolean(this.props.value)) className = styles.boolean;
    if (isNull(this.props.value)) className = styles.null;
    return (
      <div
        className={className}
        onClick={() => this.onClick()}>
        {this.renderValue(this.props.value, this.props.hasNext)}
      </div>
    );
  }
}

class Inspector extends React.Component {
  static childContextTypes = {
    options: React.PropTypes.object.isRequired
  }
  getChildContext() {
    return {
      options: {
        expanded: this.props.expanded || false,
        canEdit: this.props.canEdit || false
      }
    }
  }
  render() {
    return renderType(this.props.value, false, [], null, this.props.path);
  }
}

export default Inspector;
