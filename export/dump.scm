(load "./json.scm")

(use-modules
  (gnu packages)
  (guix packages)
  (guix ui)
  (ice-9 textual-ports)
  (util json)
  (srfi srfi-19))

; so we can display how current the package list is
(call-with-output-file
  "./docs/updated-at.json"
  (lambda (out-port)
    (display (date->string (current-date) "{ \"updatedAt\": \"~5\" }\n") out-port)))

; the package list
(call-with-output-file
  "./docs/packages.json"
  (lambda (out-port)
    (fold-packages
      (lambda (package first)
        (if first
          (display "[\n" out-port)
          (display ",\n" out-port))
        (call-with-input-string
          (call-with-output-string
            (lambda (temp)
              (package->recutils package temp)))
          (lambda (in-port)
            (translate-record in-port out-port)))
        #f)
      #t)
    (display "]\n" out-port)))

