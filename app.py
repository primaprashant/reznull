"""Flask entrypoint for the reznull demo."""

from flask import Flask, jsonify, render_template, request

from scenarios import SCENARIOS, get_simulation_payload


app = Flask(__name__)


@app.get("/")
def index():
    """Render the single-page simulation demo."""
    scenario = SCENARIOS["onboarding"]
    return render_template("index.html", scenario=scenario)


@app.get("/simulate")
def simulate():
    """Return canned simulation results for a scenario."""
    scenario_id = request.args.get("scenario", "onboarding")
    payload = get_simulation_payload(scenario_id)

    if payload is None:
        return jsonify({"error": f"Unknown scenario: {scenario_id}"}), 404

    return jsonify(payload)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
