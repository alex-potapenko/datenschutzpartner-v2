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
  DropdownPopover as HeroDropdownPopover,
  DropdownItem as HeroDropdownItem,
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
  DropdownMenu,
  DropdownSection,
  RouterProvider,
} from '@heroui/react';

export function DropdownPopover({
  className,
  ...props
}: ComponentProps<typeof HeroDropdownPopover>) {
  return <HeroDropdownPopover className={cn('squircle', className)} {...props} />;
}

export function DropdownItem({ className, ...props }: ComponentProps<typeof HeroDropdownItem>) {
  return <HeroDropdownItem className={cn('squircle-md', className)} {...props} />;
}

export { Tooltip, TooltipRoot, TooltipTrigger, TooltipContent, TooltipArrow } from '@heroui/react';
