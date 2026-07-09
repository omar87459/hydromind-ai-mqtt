import { useApp } from "../context/AppContext";
import { LoadingBlock, ErrorBlock } from "../components/common/AsyncState";
import MethodCard from "../components/methods/MethodCard";
import MethodDetail from "../components/methods/MethodDetail";

export default function MethodsPage() {
  const { methods, loading, loadError, selectedMethod, selectedMethodId, setSelectedMethodId } =
    useApp();

  if (loading) return <LoadingBlock label="Loading hydroponic methods..." />;
  if (loadError) return <ErrorBlock message={loadError} />;

  return (
    <div>
      <p className="section-sub">
        Select a method first — HydroMind AI will recommend crops that are compatible with it.
      </p>

      <div className="grid grid-cols-3">
        {methods.map((method) => (
          <MethodCard
            key={method.id}
            method={method}
            active={method.id === selectedMethodId}
            onClick={() => setSelectedMethodId(method.id)}
          />
        ))}
      </div>

      {selectedMethod && (
        <div className="mt-24">
          <MethodDetail method={selectedMethod} />
        </div>
      )}
    </div>
  );
}
