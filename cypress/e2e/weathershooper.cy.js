const CARD_NUMBER = "4242424242424242";
const CARD_EXPIRATION = "10/2030";
const CARD_CVV = "123";
const EMAIL = "testmail@weathershopper.com";
const ZIP_CODE = "12345";

describe("Weather Shopper Test", () => {
  it("should click Buy moisturizers or Buy sunscreens button based on temperature", () => {
    const selectedItems = [];

    // Visit the website
    cy.visit("/");

    // Get the temperature element and convert it to a number
    cy.get("#temperature")
      .invoke("text")
      .then((temperature) => {
        const temp = parseInt(temperature.replace(/\D/g, ""));

        // Click the appropriate button based on the temperature
        if (temp < 19) {
          cy.contains("Buy moisturizers").click();
          cy.url()
            .should("include", "/moisturizer")
            .then(() => {
              cy.get(".text-center.col-4").then((moisturizers) => {
                const items = {};

                moisturizers.each((i, el) => {
                  const name =
                    el.querySelector("p.font-weight-bold").textContent;
                  const price = parseInt(
                    el
                      .querySelector("p:last-of-type")
                      .textContent.replace(/\D/g, "")
                  );
                  items[name] = price;
                });

                // Find the cheapest moisturizer that contains Aloe
                let cheapestAloeMoisturizer = null;
                Object.entries(items).forEach(([name, price]) => {
                  if (
                    name.toLowerCase().includes("aloe") &&
                    (!cheapestAloeMoisturizer ||
                      price < cheapestAloeMoisturizer.price)
                  ) {
                    cheapestAloeMoisturizer = { name, price };
                  }
                });

                // Find the cheapest moisturizer that contains Almond
                let cheapestAlmondMoisturizer = null;
                Object.entries(items).forEach(([name, price]) => {
                  if (
                    name.toLowerCase().includes("almond") &&
                    (!cheapestAlmondMoisturizer ||
                      price < cheapestAlmondMoisturizer.price)
                  ) {
                    cheapestAlmondMoisturizer = { name, price };
                  }
                });

                // Add the cheapest Aloe moisturizer to the cart
                cy.contains(cheapestAloeMoisturizer.name)
                  .parent()
                  .find('button:contains("Add")')
                  .click();
                selectedItems.push(cheapestAloeMoisturizer.name);

                // Add the cheapest Almond moisturizer to the cart
                cy.contains(cheapestAlmondMoisturizer.name)
                  .parent()
                  .find('button:contains("Add")')
                  .click();
                selectedItems.push(cheapestAlmondMoisturizer.name);

                // Click on the cart
                cy.get("#cart").click();
              });
            });
        } else if (temp > 34) {
          cy.contains("Buy sunscreens").click();
          cy.url()
            .should("include", "/sunscreen")
            .then(() => {
              cy.get(".text-center.col-4").then((sunscreens) => {
                const items = {};

                sunscreens.each((i, el) => {
                  const name =
                    el.querySelector("p.font-weight-bold").textContent;
                  const price = parseInt(
                    el
                      .querySelector("p:last-of-type")
                      .textContent.replace(/\D/g, "")
                  );
                  items[name] = price;
                });

                // Find the cheapest sunscreen that contains spf-30
                let spf30 = null;
                Object.entries(items).forEach(([name, price]) => {
                  if (
                    name.toLowerCase().includes("spf-30") &&
                    (!spf30 || price < spf30.price)
                  ) {
                    spf30 = { name, price };
                  }
                });

                // Find the cheapest sunscreen that contains spf-50
                let spf50 = null;
                Object.entries(items).forEach(([name, price]) => {
                  if (
                    name.toLowerCase().includes("spf-50") &&
                    (!spf50 || price < spf50.price)
                  ) {
                    spf50 = { name, price };
                  }
                });

                // Add the cheapest spf30 sunscreen to the cart
                cy.contains(spf30.name)
                  .parent()
                  .find('button:contains("Add")')
                  .click();
                selectedItems.push(spf30.name);

                // Add the cheapest spf50 sunscreen to the cart
                cy.contains(spf50.name)
                  .parent()
                  .find('button:contains("Add")')
                  .click();
                selectedItems.push(spf50.name);

                // Click on the cart
                cy.get("#cart").click();
              });
            });
        } else {
          throw new Error("Temperature condition not met");
        }
      });

    // Cart page
    cy.url().should("include", "/cart");
    // Grab item prices from table
    cy.get(".table-striped tbody tr td:nth-child(2)").then(($prices) => {
      let total = 0;

      // Calculate total from item prices
      $prices.each((index, price) => {
        total += Number(price.textContent);
      });

      // Verify if total is correct
      cy.get("#total").should("have.text", `Total: Rupees ${total}`);
    });

    selectedItems.forEach((item) => {
      cy.get('.table-striped tbody tr td:first-child').should('contain', item);
    });

    cy.contains("Pay with Card")
      .click()
      .then(() => {
        // Get the iframe document and body
        const getIframeDocument = () => {
          return cy.get("iframe").its("0.contentDocument").should("exist");
        };
        const getIframeBody = () => {
          return getIframeDocument()
            .its("body")
            .should("not.be.undefined")
            .then(cy.wrap);
        };

        // Fill the payment details modal
        getIframeBody().find("#email").type(EMAIL, { force: true });
        getIframeBody().find("#card_number").type(CARD_NUMBER, { force: true });
        getIframeBody().find("#cc-exp").type(CARD_EXPIRATION, { force: true });
        getIframeBody().find("#cc-csc").type(CARD_CVV, { force: true });
        getIframeBody().find("#billing-zip").type(ZIP_CODE, { force: true });
        cy.intercept("POST", "https://api.stripe.com/v1/tokens").as(
          "stripeRequest"
        );
        getIframeBody().find("#submitButton").click();
        cy.wait("@stripeRequest");

        cy.url().should("include", "/confirmation");
        cy.get("h2").should("be.visible").contains("PAYMENT SUCCESS");
      });
  });
});
