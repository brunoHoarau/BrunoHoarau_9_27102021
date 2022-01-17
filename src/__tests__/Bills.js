import { fireEvent, getByTestId, screen } from "@testing-library/dom"
import { toHaveClass, toHaveAttribute, tohaveStyle } from "@testing-library/jest-dom"
import userEvent from "@testing-library/user-event"
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills.js"
import Firestore from "../app/Firestore"
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import Router from "../app/Router.js"
import { bills } from "../fixtures/bills.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import firebase from "../__mocks__/firebase"

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
     
      // Mock data & simulat page
     jest.fn(Firestore);
     Firestore.bills = () => { return {get: jest.fn().mockResolvedValue()}}

     Object.defineProperty(window, 'location', {
      value:{
        hash: ROUTES_PATH['Bills']
      }})
    
    document.body.innerHTML = '<div id="root"></div>'
    jest.fn(Router())
    
    const idIcon = screen.getByTestId("icon-window") 
    expect(idIcon).toHaveClass("active-icon")
    })

    test("Then bills should be ordered from earliest to latest", () => {
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
  describe('When I am on Bills Page but it is loading', () => {
    test('Then, Loading page should be rendered', () => {
        const html = BillsUI({ loading: true })
        document.body.innerHTML = html
        expect(screen.getAllByText('Loading...')).toBeTruthy()
    })
  })
  describe('When I am on Bills Page but back-end send an error message', () => {
    test('Then, Error page should be rendered', () => {
        const html = BillsUI({ error: true })
        document.body.innerHTML = html
        expect(screen.getAllByText('Erreur')).toBeTruthy()
    })   
  })

  // Integration test

  describe("When I navigate to Bills UI", () => {
    test("fetches bills from mock API GET", async () => {
      const getSpyFirebase = jest.spyOn(firebase, "get");
      

      // Get bills and the new bill
      const billsFirebase = await firebase.get();
  

      // getSpyFirebase must have been called once
      expect(getSpyFirebase).toHaveBeenCalledTimes(1);
     
      // The number of bills must be 4
      expect(billsFirebase.data.length).toBe(4);

    });



    test("fetches bills from an API and fails with 404 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      );

      // user interface creation with error code
      const html = BillsUI({
        error: "Erreur 404"
      });
      document.body.innerHTML = html;

      const message = screen.getByText(/Erreur 404/);
      // wait for the error message 400
      expect(message).toBeTruthy();
    });

    test("fetches messages from an API and fails with 500 message error", async () => {
      firebase.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 500"))
      );

      // user interface creation with error code
      const html = BillsUI({
        error: "Erreur 500"
      });
      document.body.innerHTML = html;

      const message = screen.getByText(/Erreur 500/);
      // wait for the error message 400
      expect(message).toBeTruthy();
    });
  });

  describe("When I am on Bills page but it's loading", () => {
    test('Then I should land on a loading page', () => {
      // build user interface
      const html = BillsUI({
        data: [],
        loading: true
      });
      document.body.innerHTML = html;

      // screen should show Loading
      expect(screen.getAllByText('Loading...')).toBeTruthy();
    });
  });

  // ERROR PAGE for views/BillsUI.js
  describe('When I am on Bills page but back-end send an error message', () => {
    test('Then I should land on an error page', () => {
      // build user interface
      const html = BillsUI({
        data: [],
        loading: false,
        error: 'Whoops!'
      });
      document.body.innerHTML = html;

      // screen should show Erreur
      expect(screen.getAllByText('Erreur')).toBeTruthy();
    });
  });

  // handleClickNewBill for container/Bills.js
  describe('Given I am connected as Employee and I am on Bills page', () => {
    describe('When I click on the New Bill button', () => {
      test('Then, it should render NewBill page', () => {
         const onNavigate = (pathname) => {
           document.body.innerHTML = ROUTES ({pathname})
         }
        
        Object.defineProperties(window, localStorage, { value: localStorageMock})
        window.localStorage.setItem( 'user', JSON.stringify({
          type: 'Employee'
        }))

        // build user interface
        const html = BillsUI({
          data: bills
        });

        document.body.innerHTML = html;
        // Init firestore
        const firestore = null ;

        // Init Bills
        const allBills = new Bills({
          document,
          onNavigate,
          firestore,
          localStorage: window.localStorage,
        });

        // Mock handleClickNewBill
        const handleClickNewBill = jest.fn(allBills.handleClickNewBill);
        // Get button eye in DOM
        const billBtn = screen.getByTestId('btn-new-bill');

        // Add event and fire
        billBtn.addEventListener('click', handleClickNewBill);
        fireEvent.click(billBtn);
        expect ( handleClickNewBill).toHaveBeenCalled(); 
        // screen should show Envoyer une note de frais
        // const billText = screen.getByText('Envoyer une note de frais')
        // expect(billText).toBeTruthy();
      });
    });
  });

  // handleClickIconEye for container/Bills.js
  describe('When I click on the icon eye', () => {
    test('A modal should open', () => {
      // build user interface
      const html = BillsUI({
        data: bills
      });
      document.body.innerHTML = html;

      // Init firestore
      const firestore = null;
      // Init Bills
      const allBills = new Bills({
        document,
        onNavigate,
        firestore,
        localStorage: window.localStorage,
      });

      // Mock modal comportment
      $.fn.modal = jest.fn();

      // Get button eye in DOM
      const eye = screen.getAllByTestId('icon-eye')[0];

      // Mock function handleClickIconEye
      const handleClickIconEye = jest.fn(() =>
        allBills.handleClickIconEye(eye)
      );

      // Add Event and fire
      eye.addEventListener('click', handleClickIconEye);
      fireEvent.click(eye);

      // handleClickIconEye function must be called
      expect(handleClickIconEye).toHaveBeenCalled();
      const modale = document.getElementById('modaleFile');
      // The modal must be present
      expect(modale).toBeTruthy();
    });
  });
})