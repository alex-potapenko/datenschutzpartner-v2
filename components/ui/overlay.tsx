/**
 * Local seam over HeroUI overlays (modals, dropdowns, drawers).
 */
import type { ComponentProps } from 'react';
import {
  ModalDialog as HeroModalDialog,
  ModalRoot,
  ModalBackdrop,
  ModalContainer,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalHeading,
  useOverlayState,
} from '@heroui/react';
import { cn } from '@/lib/utils';

export {
  ModalRoot,
  ModalBackdrop,
  ModalContainer,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalHeading,
  useOverlayState,
};

export function ModalDialog({ className, ...props }: ComponentProps<typeof HeroModalDialog>) {
  return <HeroModalDialog className={cn('squircle', className)} {...props} />;
}

export {
  DrawerRoot,
  DrawerTrigger,
  DrawerBackdrop,
  DrawerContent,
  DrawerDialog,
  DrawerHeader,
  DrawerHeading,
  DrawerBody,
  DrawerFooter,
  DrawerCloseTrigger,
} from '@heroui/react';

export {
  DropdownRoot,
  DropdownTrigger,
  DropdownPopover,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
  RouterProvider,
} from '@heroui/react';

export { Tooltip, TooltipRoot, TooltipTrigger, TooltipContent, TooltipArrow } from '@heroui/react';
