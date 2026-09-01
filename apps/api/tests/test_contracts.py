from src.schemas import ComparabilityRequest, ImportPreview, PlanValidationRequest


def test_key_contracts_have_json_schemas() -> None:
    for model in (ComparabilityRequest, ImportPreview, PlanValidationRequest):
        schema = model.model_json_schema()
        assert schema["type"] == "object"
        assert schema["properties"]

