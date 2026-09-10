import { BusinessProfile, type BusinessProfileProps } from "./BusinessProfile";

interface BusinessModalProps extends BusinessProfileProps {
  onClose: () => void;
}

export function BusinessModal({ onClose, ...props }: BusinessModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-stone-900/60 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby="modal-business-name" className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl" id="business-detail-modal">
        <BusinessProfile key={props.business.id} {...props} presentation="modal" onClose={onClose} />
      </div>
    </div>
  );
}
