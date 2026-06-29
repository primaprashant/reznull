"""Hardcoded scenario data for the reznull MVP."""

SCENARIOS: dict[str, dict[str, object]] = {
    "onboarding": {
        "id": "onboarding",
        "name": "SaaS onboarding",
        "metric_label": "First-session data source connection",
        "control": {
            "id": "control",
            "label": "Current onboarding",
            "copy": (
                "New users land on a standard welcome screen, then choose from "
                "setup, docs, or inviting teammates before connecting data."
            ),
            "predicted_metric": 22.0,
        },
        "variants": [
            {
                "id": "guided_checklist",
                "label": "Guided checklist",
                "copy": (
                    "A four-step checklist keeps users focused on connecting "
                    "their first data source before exploring advanced setup."
                ),
                "predicted_metric": 28.4,
            },
            {
                "id": "skip_to_value",
                "label": "Skip-to-value default",
                "copy": (
                    "The first screen opens on a preloaded sample dashboard, "
                    "then asks users to connect their own source to replace it."
                ),
                "predicted_metric": 29.1,
            },
            {
                "id": "template_gallery",
                "label": "Template gallery",
                "copy": (
                    "Users pick a role-based template first, then the product "
                    "recommends the data source needed to make it useful."
                ),
                "predicted_metric": 26.7,
            },
            {
                "id": "ai_setup_assistant",
                "label": "AI setup assistant",
                "copy": (
                    "A setup assistant asks two questions, recommends the right "
                    "connection path, and handles field mapping automatically."
                ),
                "predicted_metric": 31.0,
            },
            {
                "id": "two_field_signup",
                "label": "Two-field signup",
                "copy": (
                    "Signup asks only for work email and company URL, then "
                    "routes users straight into the connection flow."
                ),
                "predicted_metric": 27.3,
            },
        ],
    }
}


def get_simulation_payload(scenario_id: str) -> dict[str, object] | None:
    """Build the JSON payload returned by the simulation endpoint.

    Args:
        scenario_id: The identifier of the scenario to simulate.

    Returns:
        A serializable payload with variants ranked by predicted metric, or
        None when the scenario does not exist.
    """
    scenario = SCENARIOS.get(scenario_id)
    if scenario is None:
        return None

    variants = sorted(
        scenario["variants"],
        key=lambda variant: variant["predicted_metric"],
        reverse=True,
    )

    return {
        "scenario": {
            "id": scenario["id"],
            "name": scenario["name"],
            "metric_label": scenario["metric_label"],
        },
        "control": scenario["control"],
        "variants": variants,
    }
