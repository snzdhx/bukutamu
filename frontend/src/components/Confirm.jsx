import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Pengganti confirm() bawaan browser: modal bertema hijau-emas.
// Pemakaian: const ok = await confirm('Yakin?', { title, okText, cancelText, danger });
const Ctx = createContext(() => Promise.resolve(false));
export const useConfirm = () => useContext(Ctx);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const confirm = useCallback(
    (message, opts = {}) => new Promise((resolve) => setState({ message, opts, resolve })),
    [],
  );
  const close = useCallback((v) => { setState((s) => { s?.resolve(v); return null; }); }, []);

  useEffect(() => {
    if (!state) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') close(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [state, close]);

  const { title = 'Konfirmasi', okText = 'Ya', cancelText = 'Batal', danger = false } = state?.opts || {};

  return (
    <Ctx.Provider value={confirm}>
      {children}
      {state && (
        <div className="adm-modal" onClick={(e) => { if (e.target === e.currentTarget) close(false); }}>
          <div className="modal-content" style={{ maxWidth: 420 }}>
            <h2>{title}</h2>
            <p className="admin-confirm-message">{state.message}</p>
            <div className="button-group">
              <button type="button" className="adm-btn btn-secondary" onClick={() => close(false)}>{cancelText}</button>
              <button type="button" className={'adm-btn ' + (danger ? 'btn-hapus' : 'btn-primary')} autoFocus onClick={() => close(true)}>{okText}</button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}