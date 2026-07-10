import { useTranslation } from "react-i18next";
import { useApp } from "../context/AppContext";
import { LoadingBlock, ErrorBlock } from "../components/common/AsyncState";
import MethodCard from "../components/methods/MethodCard";
import MethodDetail from "../components/methods/MethodDetail";

export default function MethodsPage() {
  const { t } = useTranslation();
  const { methods, loading, loadError, selectedMethod, selectedMethodId, setSelectedMethodId } =
    useApp();

  if (loading) return <LoadingBlock label={t("common.loading")} />;
  if (loadError) return <ErrorBlock message={loadError} />;

  return (
    <div>
      <p className="section-sub">{t("methods.intro")}</p>

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
