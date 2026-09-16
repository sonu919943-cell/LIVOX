import CareWorkspace from "../../components/CareWorkspace/CareWorkspace";

export default function Dashboard({ userName }) {
  return <CareWorkspace screen="dashboard" userName={userName} />;
}
