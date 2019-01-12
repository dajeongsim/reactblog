import React from 'react';
import styles from './Button.module.scss';
import classNames from 'classnames/bind';
import { Link } from 'react-router-dom';

const cx = classNames.bind(styles);

// 전달받은 className, onClick 등 값들이 rest 안에 들어있다.
const Div = ({children, ...rest}) => <div {...rest}>{children}</div>;

const Button = ({
  children, to, onClick, disabled, theme = 'default',
}) => {
  // to 값이 존재하면 Link를 사용하고, 그렇지 않으면 div를 사용한다.
  // 비활성화 되어 있는 버튼일 때도 div를 사용.
  const Element = (to && !disabled) ? Link : Div;

  // 비활성화하면 onClick은 실행되지 않는다.
  // disabled 값이 true가 되면 className에 disabled를 추가한다.
  return (
  <Element
    to={to}
    className={cx('button', theme, {disabled})}
    onClick={disabled ? () => null : onClick}>
    {children}
  </Element>
  );
};

export default Button;
