(load "./json.scm")

(use-modules
  (gnu packages)
  (guix packages)
  (guix ui)
  (ice-9 textual-ports)
  (util json))

(call-with-output-file
  "packages.txt"
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
