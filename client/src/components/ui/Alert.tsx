import './Alert.css';

/** Form-level error shown above the fields (design: "Сообщение об ошибке над формой"). */
export function Alert({ children }: { children: string }) {
  return (
    <div className="alert" role="alert">
      <span className="alert__icon" aria-hidden="true">
        !
      </span>
      {children}
    </div>
  );
}
