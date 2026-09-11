'use client';

interface DataConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  labelClassName?: string;
}

/**
 * Casilla obligatoria de autorización de tratamiento de datos personales
 * (Habeas Data - Ley 1581 de 2012). Se usa en todo formulario de recolección
 * de datos del cliente, excepto en la solicitud de pedido (checkout) y en
 * procesos de autenticación donde el consentimiento no se ve vulnerado.
 */
export function DataConsentCheckbox({ checked, onChange, labelClassName = '' }: DataConsentCheckboxProps) {
  return (
    <label className={`flex items-start gap-2.5 text-xs leading-relaxed text-neutral-600 cursor-pointer ${labelClassName}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded accent-[#d88193]"
        aria-required="true"
      />
      <span>
        Autorizo el tratamiento de mis datos personales y acepto la{' '}
        <a
          href="https://ushuaiajeans.com.co/policies/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-[#d88193]"
        >
          Política de Privacidad y Tratamiento de Datos (Habeas Data - Ley 1581 de 2012)
        </a>
        , incluyendo el contacto por correo, teléfono y WhatsApp para información comercial y de servicio.
      </span>
    </label>
  );
}