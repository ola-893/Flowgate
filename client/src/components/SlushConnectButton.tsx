import React from "react";
import { ConnectButton } from "@mysten/dapp-kit-react/ui";

interface SlushConnectButtonProps {
  className?: string;
  scale?: boolean;
}

/**
 * Wraps the native Mysten Labs ConnectButton (wide modal with wallet
 * descriptions). Uses filterFn to hide all wallet options except Slush
 * from the selection modal.
 *
 * The filterFn operates on wallets that the ConnectButton's own modal
 * discovers via wallet injection — NOT on useWallets() which returns
 * all "known" wallets. This means only actually-injected wallets appear.
 */
export default function SlushConnectButton({
  className = "",
  scale = false,
}: SlushConnectButtonProps) {
  return (
    <div
      className={className}
      style={scale ? { transform: "scale(0.85)", transformOrigin: "right center" } : undefined}
    >
      <ConnectButton
        modalOptions={{
          filterFn: (wallet: any) => /slush|sui wallet/i.test(wallet.name),
        }}
      />
    </div>
  );
}
