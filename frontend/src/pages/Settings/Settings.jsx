import CareWorkspace from "../../components/CareWorkspace/CareWorkspace";

export default function Settings({ userName }) {
  return <CareWorkspace screen="settings" userName={userName} />;
}
