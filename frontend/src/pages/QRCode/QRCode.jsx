import CareWorkspace from "../../components/CareWorkspace/CareWorkspace";

export default function QRCode({ userName }) {
  return <CareWorkspace screen="qr" userName={userName} />;
}
