import CareWorkspace from "../../components/CareWorkspace/CareWorkspace";

export default function MedicalProfile({ userName }) {
  return <CareWorkspace screen="profile" userName={userName} />;
}
