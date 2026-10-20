import { createContext, useCallback, useContext, useState } from 'react';

const Ctx = createContext(() => Promise.resolve(false));
export const useConfirm = () => useContext(Ctx);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const confirm = useCallback((message) => new Promise((resolve) => setState({ message, resolve })), []);
  const close = (v) => { state.resolve(v); setState(null); };
  return (
    <Ctx.Provider value={confirm}>
      {children}
      {state && (
        <div className="modal-back" onClick={() => close(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <p>{state.message}</p>
            <div className="row end">
              <button className="btn ghost" onClick={() => close(false)}>Batal</button>
              <button className="btn danger" onClick={() => close(true)}>Ya, lanjutkan</button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
