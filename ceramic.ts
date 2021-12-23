import { Core } from "@self.id/core";

import type { BasicProfile } from "@ceramicstudio/idx-constants";
import { addrToCaip } from "./caip10";

const core = new Core({ ceramic: "mainnet-gateway" });

export async function getProfileInfo(
  tezosWallet: string
): Promise<BasicProfile | null> {
  try {
    const did = await core.getAccountDID(addrToCaip.xtz(tezosWallet));
    const basicProfileInfo = await core.get("basicProfile", did);
    return basicProfileInfo;
  } catch (ignore) {
    return null;
  }
}
