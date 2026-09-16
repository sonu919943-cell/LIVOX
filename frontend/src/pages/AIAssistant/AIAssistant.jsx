import CareWorkspace from "../../components/CareWorkspace/CareWorkspace";

export default function AIAssistant({ userName }) {
  return <CareWorkspace screen="assistant" userName={userName} />;
}
