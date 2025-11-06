import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Button
} from "@/components/ui/button";
import { DialogClose } from "@radix-ui/react-dialog";
import * as React from 'react';

function WrapForm({
  form = { isForm: false, onSubmit: undefined },
  onSubmittingChange,
  children
}) {
  const isForm = !!form?.isForm;
  const onSubmit = form?.onSubmit;
  if (isForm && typeof onSubmit === 'function') return (
    <form
      id='modalForm'
      onSubmit={async (e) => {
        try {
          onSubmittingChange?.(true);
          await onSubmit(e);
        } finally {
          onSubmittingChange?.(false);
        }
      }}>
      {children}
    </form>
  );
  return children;
};

const BottomGradient = () => {
  return (
    <>
      <span
        className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span
        className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

export default function Modal({
  header,
  footer,
  state,
  form,
  close
}) {
  const [submitting, setSubmitting] = React.useState(false);
  return (
    <Dialog open={state.open} onOpenChange={(next) => { if (!next) close(); }}>
      <DialogContent className="sm:max-w-[425px]">
        <WrapForm form={form} onSubmittingChange={setSubmitting}>
          <DialogHeader>
            <DialogTitle>{header.title}</DialogTitle>
            {header.description && <DialogDescription>{header.description}</DialogDescription>}
          </DialogHeader>
          <div className="max-h-[50svh] overflow-y-auto overscroll-contain my-10">
            {state.content}
          </div>
          {(footer.showCancel || footer.showSubmit) && (
            <DialogFooter>
              {footer.showCancel && (
                <DialogClose asChild>
                  <Button variant={footer.cancelVariant}>{footer.cancelText}<BottomGradient /></Button>
                </DialogClose>
              )}
              {footer.showSubmit && (
                <Button
                  type="submit"
                  variant={footer.submitVariant}
                  aria-label='submit'
                  isLoading={submitting}
                >
                  {footer.submitText}
                  <BottomGradient />
                </Button>
              )}
            </DialogFooter>
          )}
        </WrapForm>
      </DialogContent>
    </Dialog>
  )
};
