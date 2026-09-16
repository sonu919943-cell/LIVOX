import CareWorkspace from "../../components/CareWorkspace/CareWorkspace";

export default function BloodDonor({ userName }) {
  return <CareWorkspace screen="donors" userName={userName} />;
}
